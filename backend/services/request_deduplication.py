"""Request deduplication service for AI operations.

Prevents duplicate concurrent AI requests by tracking in-flight requests
and returning the same result to all callers with identical parameters.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from typing import Any, Callable, Coroutine, Generic, TypeVar

from logging_config import get_logger


logger = get_logger(__name__)

T = TypeVar("T")


class PendingRequest(Generic[T]):
    """Tracks a pending request and its waiters."""

    __slots__ = ("future", "created_at", "request_hash")

    def __init__(self, request_hash: str):
        self.request_hash = request_hash
        self.future: asyncio.Future[T] = asyncio.get_event_loop().create_future()
        self.created_at = time.monotonic()


class RequestDeduplicator:
    """Prevents duplicate concurrent AI requests.

    When multiple requests with identical parameters come in simultaneously,
    only one actual computation is performed. All callers receive the same result.

    This is especially useful for AI generation where:
    - Requests are expensive (API calls, token costs)
    - Multiple UI events might trigger the same request
    - Race conditions could cause duplicate work

    Usage:
        dedup = RequestDeduplicator()

        # These concurrent calls will result in only one actual API call
        result1 = await dedup.deduplicate(
            "suggest_modules",
            {"course_id": "123"},
            lambda: ai_service.suggest_modules(request)
        )
        result2 = await dedup.deduplicate(
            "suggest_modules",
            {"course_id": "123"},
            lambda: ai_service.suggest_modules(request)
        )
        # result1 == result2, but only one API call was made

    Note:
        - Does NOT cache results between separate request windows
        - Only deduplicates truly concurrent requests
        - Automatically cleans up completed/failed requests
    """

    # Maximum time a pending request can wait before being considered stale
    MAX_PENDING_TIME_SECONDS = 300  # 5 minutes

    def __init__(self):
        self._pending: dict[str, PendingRequest[Any]] = {}
        self._lock = asyncio.Lock()

    def _compute_hash(self, operation: str, params: dict[str, Any]) -> str:
        """Compute a hash for the operation and parameters.

        Args:
            operation: The operation name (e.g., "suggest_modules")
            params: The request parameters

        Returns:
            A hex string hash uniquely identifying this request
        """
        # Sort keys for consistent hashing
        content = json.dumps(
            {"operation": operation, "params": params},
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(content.encode()).hexdigest()[:32]

    async def deduplicate(
        self,
        operation: str,
        params: dict[str, Any],
        compute_fn: Callable[[], Coroutine[Any, Any, T]],
    ) -> T:
        """Execute a function, deduplicating concurrent identical requests.

        Args:
            operation: Operation name for logging/grouping
            params: Request parameters (used to identify duplicates)
            compute_fn: Async function that performs the actual work

        Returns:
            The result of the computation

        Raises:
            Any exception raised by compute_fn
        """
        request_hash = self._compute_hash(operation, params)

        async with self._lock:
            # Cleanup stale requests
            self._cleanup_stale()

            # Check if there's already a pending request
            if request_hash in self._pending:
                pending = self._pending[request_hash]
                logger.info(
                    f"Request deduplicated - waiting for existing request",
                    operation=operation,
                    request_hash=request_hash[:8],
                )
                # Wait outside the lock
                async with asyncio.timeout(self.MAX_PENDING_TIME_SECONDS):
                    return await pending.future

            # Create a new pending request
            pending = PendingRequest[T](request_hash)
            self._pending[request_hash] = pending
            logger.debug(
                f"New request started",
                operation=operation,
                request_hash=request_hash[:8],
            )

        # Execute the computation outside the lock
        try:
            result = await compute_fn()
            pending.future.set_result(result)
            logger.debug(
                f"Request completed successfully",
                operation=operation,
                request_hash=request_hash[:8],
            )
            return result
        except Exception as e:
            pending.future.set_exception(e)
            logger.error(
                f"Request failed",
                operation=operation,
                request_hash=request_hash[:8],
                error_type=type(e).__name__,
                error_message=str(e),
            )
            raise
        finally:
            # Cleanup this request
            async with self._lock:
                self._pending.pop(request_hash, None)

    def _cleanup_stale(self) -> None:
        """Remove any stale pending requests."""
        now = time.monotonic()
        stale_keys = [
            key
            for key, pending in self._pending.items()
            if now - pending.created_at > self.MAX_PENDING_TIME_SECONDS
        ]
        for key in stale_keys:
            # Cancel the future if still pending
            pending = self._pending.pop(key, None)
            if pending and not pending.future.done():
                pending.future.cancel()
                logger.warning(
                    f"Stale request cleaned up",
                    request_hash=key[:8],
                )

    @property
    def pending_count(self) -> int:
        """Get the number of pending requests."""
        return len(self._pending)

    def stats(self) -> dict[str, Any]:
        """Get statistics about pending requests."""
        now = time.monotonic()
        return {
            "pending_count": len(self._pending),
            "oldest_pending_age_seconds": (
                min(now - p.created_at for p in self._pending.values())
                if self._pending
                else 0
            ),
        }


# Global instance (singleton)
_deduplicator_instance: RequestDeduplicator | None = None


def get_request_deduplicator() -> RequestDeduplicator:
    """Get the global request deduplicator instance.

    Returns:
        The singleton RequestDeduplicator instance
    """
    global _deduplicator_instance
    if _deduplicator_instance is None:
        _deduplicator_instance = RequestDeduplicator()
    return _deduplicator_instance
