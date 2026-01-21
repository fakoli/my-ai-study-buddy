"""In-memory cache service with TTL support.

Provides a simple caching layer for frequently accessed data to reduce
database queries and improve response times.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Callable, Coroutine, TypeVar

from logging_config import get_logger


logger = get_logger(__name__)

T = TypeVar("T")


class CacheEntry:
    """A single cache entry with value and expiration time."""

    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.expires_at = time.monotonic() + ttl_seconds

    def is_expired(self) -> bool:
        return time.monotonic() > self.expires_at


class CacheService:
    """In-memory cache with TTL for frequently accessed data.

    Thread-safe for use with asyncio. Uses monotonic time for expiration
    to avoid issues with system clock changes.

    Default TTLs by resource type:
        - course: 300s (5 min)
        - modules:count: 60s (1 min)
        - user:courses: 120s (2 min)
        - admin:stats: 30s

    Usage:
        cache = CacheService()

        # Get or compute a value
        result = await cache.get_or_compute(
            key="course:123",
            compute_fn=lambda: fetch_course(123),
            ttl_seconds=300
        )

        # Invalidate specific key
        cache.invalidate("course:123")

        # Invalidate by pattern
        cache.invalidate_pattern("course:")
    """

    # Default TTLs for different resource types
    DEFAULT_TTLS = {
        "course": 300,  # 5 minutes
        "modules:count": 60,  # 1 minute
        "user:courses": 120,  # 2 minutes
        "admin:stats": 30,  # 30 seconds
    }

    def __init__(self, max_size: int = 10000):
        """Initialize the cache.

        Args:
            max_size: Maximum number of entries to store. When exceeded,
                      expired entries are cleaned up, then oldest entries
                      are evicted if still over limit.
        """
        self._cache: dict[str, CacheEntry] = {}
        self._max_size = max_size
        self._lock = asyncio.Lock()
        self._pending: dict[str, asyncio.Future[Any]] = {}

    def get(self, key: str) -> tuple[Any, bool]:
        """Get a value from cache.

        Args:
            key: The cache key

        Returns:
            Tuple of (value, found). value is None if not found or expired.
        """
        entry = self._cache.get(key)
        if entry is None:
            return None, False
        if entry.is_expired():
            del self._cache[key]
            return None, False
        return entry.value, True

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Set a value in cache.

        Args:
            key: The cache key
            value: The value to store
            ttl_seconds: Time-to-live in seconds. If None, uses default TTL
                        based on key prefix.
        """
        if ttl_seconds is None:
            ttl_seconds = self._get_default_ttl(key)

        self._cache[key] = CacheEntry(value, ttl_seconds)

        # Cleanup if over size limit
        if len(self._cache) > self._max_size:
            self._cleanup()

    async def get_or_compute(
        self,
        key: str,
        compute_fn: Callable[[], Coroutine[Any, Any, T]],
        ttl_seconds: int | None = None,
    ) -> T:
        """Get from cache or compute and cache result.

        This method handles deduplication of concurrent requests for the same key.
        If multiple callers request the same key simultaneously, only one computation
        will be performed.

        Args:
            key: The cache key
            compute_fn: Async function to compute the value if not cached
            ttl_seconds: TTL in seconds (uses default if None)

        Returns:
            The cached or computed value
        """
        # Fast path: check cache without lock
        value, found = self.get(key)
        if found:
            logger.debug(f"Cache hit", key=key)
            return value

        # Acquire lock for computation deduplication
        async with self._lock:
            # Double-check after acquiring lock
            value, found = self.get(key)
            if found:
                logger.debug(f"Cache hit (after lock)", key=key)
                return value

            # Check if there's already a pending computation
            if key in self._pending:
                logger.debug(f"Waiting for pending computation", key=key)
                return await self._pending[key]

            # Start new computation
            logger.debug(f"Cache miss, computing", key=key)
            future: asyncio.Future[T] = asyncio.get_event_loop().create_future()
            self._pending[key] = future

        # Compute outside the lock
        try:
            result = await compute_fn()
            self.set(key, result, ttl_seconds)
            future.set_result(result)
            return result
        except Exception as e:
            future.set_exception(e)
            raise
        finally:
            async with self._lock:
                self._pending.pop(key, None)

    def invalidate(self, key: str) -> bool:
        """Invalidate a specific cache entry.

        Args:
            key: The exact cache key to invalidate

        Returns:
            True if the key was found and removed
        """
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache invalidated", key=key)
            return True
        return False

    def invalidate_pattern(self, prefix: str) -> int:
        """Invalidate all cache entries matching a key prefix.

        Args:
            prefix: The key prefix to match

        Returns:
            Number of entries invalidated
        """
        keys_to_remove = [k for k in self._cache if k.startswith(prefix)]
        for key in keys_to_remove:
            del self._cache[key]

        if keys_to_remove:
            logger.debug(f"Cache invalidated by pattern", prefix=prefix, count=len(keys_to_remove))

        return len(keys_to_remove)

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        logger.debug("Cache cleared")

    def stats(self) -> dict[str, Any]:
        """Get cache statistics.

        Returns:
            Dict with size, expired_count, and breakdown by key prefix
        """
        expired_count = sum(1 for e in self._cache.values() if e.is_expired())

        # Group by key prefix
        prefix_counts: dict[str, int] = {}
        for key in self._cache:
            prefix = key.split(":")[0] if ":" in key else key
            prefix_counts[prefix] = prefix_counts.get(prefix, 0) + 1

        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "expired_count": expired_count,
            "pending_computations": len(self._pending),
            "by_prefix": prefix_counts,
        }

    def _get_default_ttl(self, key: str) -> int:
        """Get default TTL based on key prefix.

        Args:
            key: The cache key

        Returns:
            TTL in seconds
        """
        for prefix, ttl in self.DEFAULT_TTLS.items():
            if key.startswith(prefix):
                return ttl
        return 60  # Default 1 minute

    def _cleanup(self) -> None:
        """Remove expired entries and evict oldest if still over limit."""
        # Remove expired entries
        expired_keys = [k for k, e in self._cache.items() if e.is_expired()]
        for key in expired_keys:
            del self._cache[key]

        # If still over limit, remove oldest entries
        if len(self._cache) > self._max_size:
            # Sort by expiration time (oldest first)
            sorted_keys = sorted(
                self._cache.keys(),
                key=lambda k: self._cache[k].expires_at,
            )
            # Remove oldest 10%
            to_remove = sorted_keys[: len(self._cache) // 10]
            for key in to_remove:
                del self._cache[key]

            logger.debug(
                f"Cache evicted entries",
                expired=len(expired_keys),
                evicted=len(to_remove),
            )


# Global cache instance (singleton)
_cache_instance: CacheService | None = None


def get_cache() -> CacheService:
    """Get the global cache instance.

    Returns:
        The singleton CacheService instance
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance
