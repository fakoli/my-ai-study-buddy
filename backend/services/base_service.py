"""Base service class with common patterns for all services."""

from typing import Any

from exceptions import ErrorCode, ForbiddenException, NotFoundException
from storage.base import StorageBackend


class BaseService:
    """Base service providing common patterns for resource access and authorization.

    Subclasses should call super().__init__(storage) and then use the helper methods
    for consistent authorization and error handling.
    """

    def __init__(self, storage: StorageBackend):
        self.storage = storage

    async def get_owned_resource(
        self,
        collection: str,
        resource_id: str,
        user_id: str,
        resource_name: str = "Resource",
        not_found_code: ErrorCode = ErrorCode.NOT_FOUND,
    ) -> dict[str, Any]:
        """Get a resource and verify user ownership.

        This method consolidates the common pattern of:
        1. Fetching a resource by ID
        2. Checking if it exists
        3. Verifying the user owns it

        Args:
            collection: The storage collection name (e.g., "decks", "quizzes")
            resource_id: The unique identifier of the resource
            user_id: The ID of the user who should own the resource
            resource_name: Human-readable name for error messages (e.g., "Deck")
            not_found_code: ErrorCode to use for not found errors

        Returns:
            The resource data as a dict

        Raises:
            NotFoundException: If the resource doesn't exist
            ForbiddenException: If the user doesn't own the resource
        """
        data = await self.storage.get(collection, resource_id)

        if not data:
            raise NotFoundException(
                f"{resource_name} not found",
                code=not_found_code,
                details={"resource_id": resource_id},
            )

        if data.get("user_id") != user_id:
            raise ForbiddenException(
                "Access denied",
                code=ErrorCode.ACCESS_DENIED,
                details={"resource_id": resource_id},
            )

        return data

    async def get_resource_by_user_filter(
        self,
        collection: str,
        resource_id: str,
        user_id: str,
        resource_name: str = "Resource",
        not_found_code: ErrorCode = ErrorCode.NOT_FOUND,
    ) -> dict[str, Any]:
        """Get a resource ensuring it belongs to the user.

        Similar to get_owned_resource, but doesn't distinguish between "not found"
        and "not owned" for security (prevents resource enumeration).

        Args:
            collection: The storage collection name
            resource_id: The unique identifier of the resource
            user_id: The ID of the user who should own the resource
            resource_name: Human-readable name for error messages
            not_found_code: ErrorCode to use for not found errors

        Returns:
            The resource data as a dict

        Raises:
            NotFoundException: If resource doesn't exist or user doesn't own it
        """
        data = await self.storage.get(collection, resource_id)

        if not data or data.get("user_id") != user_id:
            raise NotFoundException(
                f"{resource_name} not found",
                code=not_found_code,
                details={"resource_id": resource_id},
            )

        return data

    async def verify_parent_ownership(
        self,
        parent_collection: str,
        parent_id: str,
        user_id: str,
        parent_name: str = "Parent resource",
        not_found_code: ErrorCode = ErrorCode.NOT_FOUND,
    ) -> dict[str, Any]:
        """Verify user owns a parent resource before accessing children.

        Common pattern for accessing nested resources (e.g., cards within decks).

        Args:
            parent_collection: The parent's storage collection
            parent_id: The parent resource ID
            user_id: The user ID to verify ownership
            parent_name: Human-readable name for error messages
            not_found_code: ErrorCode for not found errors

        Returns:
            The parent resource data

        Raises:
            NotFoundException: If parent doesn't exist
            ForbiddenException: If user doesn't own the parent
        """
        return await self.get_owned_resource(
            parent_collection,
            parent_id,
            user_id,
            parent_name,
            not_found_code,
        )
