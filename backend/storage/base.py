from abc import ABC, abstractmethod
from typing import Any


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

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
