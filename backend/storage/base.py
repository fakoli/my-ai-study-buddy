from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator


class StorageBackend(ABC):
    """Abstract base class for storage backends.

    All storage backends must implement the basic CRUD operations.
    Transaction support is optional but recommended for backends that support it.
    """

    @abstractmethod
    async def get(self, collection: str, id: str) -> dict[str, Any] | None:
        """Get a single document by ID."""
        ...

    @abstractmethod
    async def list(
        self, collection: str, filters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """List documents in a collection, optionally filtered."""
        ...

    @abstractmethod
    async def create(self, collection: str, data: dict[str, Any]) -> dict[str, Any]:
        """Create a new document."""
        ...

    @abstractmethod
    async def update(
        self, collection: str, id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Update an existing document."""
        ...

    @abstractmethod
    async def delete(self, collection: str, id: str) -> bool:
        """Delete a document by ID."""
        ...

    @abstractmethod
    async def count(self, collection: str, filters: dict[str, Any] | None = None) -> int:
        """Count documents in a collection."""
        ...

    # Transaction support (optional - default implementations for backends without support)

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator["StorageBackend"]:
        """Context manager for transactions.

        Usage:
            async with storage.transaction() as txn:
                await txn.create("collection", data1)
                await txn.create("collection", data2)
                # Commits on successful exit, rolls back on exception

        For backends that don't support transactions (like JSON), this provides
        a pass-through that allows the same code to work, though without
        atomicity guarantees.
        """
        yield self

    async def batch_delete(
        self, collection: str, ids: list[str]
    ) -> dict[str, bool]:
        """Delete multiple documents, returning success status for each.

        Args:
            collection: The collection name
            ids: List of document IDs to delete

        Returns:
            Dict mapping each ID to its deletion success status

        Default implementation calls delete() for each ID.
        Backends with batch support should override for better performance.
        """
        results = {}
        for id in ids:
            results[id] = await self.delete(collection, id)
        return results

    async def batch_create(
        self, collection: str, items: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Create multiple documents.

        Args:
            collection: The collection name
            items: List of documents to create

        Returns:
            List of created documents

        Default implementation calls create() for each item.
        Backends with batch support should override for better performance.
        """
        results = []
        for item in items:
            results.append(await self.create(collection, item))
        return results
