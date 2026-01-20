"""Learning path service - manages learning paths and their course collections."""

from datetime import datetime, timezone
from uuid import uuid4

from exceptions import ErrorCode, ForbiddenException, NotFoundException
from models.learning_path import (
    LearningPath,
    LearningPathCreate,
    LearningPathResponse,
    LearningPathUpdate,
)
from services.base_service import BaseService
from services.course_service import CourseService
from storage.base import StorageBackend


class LearningPathService(BaseService):
    """Manages learning paths - curated collections of courses."""

    def __init__(self, storage: StorageBackend, course_service: CourseService):
        super().__init__(storage)
        self.course_service = course_service

    async def list_paths(self, user_id: str | None = None) -> list[LearningPathResponse]:
        """List all learning paths accessible to the user.

        Returns:
            - User's own paths (if user_id provided)
            - Public paths
        """
        paths = []

        # Get user's own paths
        if user_id:
            user_paths = await self.storage.list("learning_paths", {"owner_id": user_id})
            for path_data in user_paths:
                paths.append(self._to_response(path_data))

        # Get public paths not owned by user
        public_paths = await self.storage.list(
            "learning_paths", {"visibility": "public"}
        )
        for path_data in public_paths:
            if user_id and path_data.get("owner_id") == user_id:
                continue  # Already included above
            paths.append(self._to_response(path_data))

        return paths

    async def list_user_paths(self, user_id: str) -> list[LearningPathResponse]:
        """List all learning paths owned by a user."""
        paths_data = await self.storage.list("learning_paths", {"owner_id": user_id})
        return [self._to_response(p) for p in paths_data]

    async def get_path(
        self, path_id: str, user_id: str | None = None
    ) -> LearningPath:
        """Get a learning path by ID.

        Args:
            path_id: Learning path ID
            user_id: Optional user ID for access check

        Returns:
            LearningPath if found and accessible

        Raises:
            NotFoundException: If path not found or not accessible
        """
        path_data = await self.storage.get("learning_paths", path_id)

        if not path_data:
            raise NotFoundException(
                "Learning path not found",
                code=ErrorCode.LEARNING_PATH_NOT_FOUND,
                details={"path_id": path_id},
            )

        # Check visibility
        visibility = path_data.get("visibility", "private")
        if visibility == "private" and path_data.get("owner_id") != user_id:
            raise NotFoundException(
                "Learning path not found",
                code=ErrorCode.LEARNING_PATH_NOT_FOUND,
                details={"path_id": path_id},
            )

        return LearningPath(**path_data)

    async def create_path(
        self, user_id: str, data: LearningPathCreate
    ) -> LearningPath:
        """Create a new learning path."""
        now = datetime.now(timezone.utc)

        # Validate that all course_ids exist and are accessible
        for course_id in data.course_ids:
            try:
                await self.course_service.get_course(course_id, user_id)
            except NotFoundException:
                raise NotFoundException(
                    f"Course {course_id} not found",
                    code=ErrorCode.COURSE_NOT_FOUND,
                )

        path = LearningPath(
            id=str(uuid4()),
            owner_id=user_id,
            title=data.title,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            difficulty=data.difficulty,
            estimated_hours=data.estimated_hours,
            course_ids=data.course_ids,
            visibility=data.visibility,
            created_at=now,
            updated_at=now,
        )

        await self.storage.create("learning_paths", path.model_dump(mode="json"))

        # Increment times_added for each course
        for course_id in data.course_ids:
            await self.course_service.increment_times_added(course_id)

        return path

    async def update_path(
        self, path_id: str, user_id: str, data: LearningPathUpdate
    ) -> LearningPath:
        """Update a learning path (owner only)."""
        # Verify ownership
        path_data = await self._get_owned_path(path_id, user_id)

        # Apply updates
        updates = data.model_dump(exclude_unset=True, mode="json")
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        updated_data = await self.storage.update("learning_paths", path_id, updates)
        if not updated_data:
            raise NotFoundException(
                "Learning path not found",
                code=ErrorCode.LEARNING_PATH_NOT_FOUND,
            )

        return LearningPath(**updated_data)

    async def delete_path(self, path_id: str, user_id: str) -> bool:
        """Delete a learning path (owner only)."""
        # Verify ownership and get course IDs for cleanup
        path_data = await self._get_owned_path(path_id, user_id)
        # Note: path_data used below for course_ids

        # Decrement times_added for each course
        for course_id in path_data.get("course_ids", []):
            await self.course_service.decrement_times_added(course_id)

        return await self.storage.delete("learning_paths", path_id)

    async def add_course_to_path(
        self, path_id: str, user_id: str, course_id: str
    ) -> LearningPath:
        """Add a course to a learning path."""
        # Verify path ownership
        path_data = await self._get_owned_path(path_id, user_id)

        # Verify course exists and is accessible
        try:
            await self.course_service.get_course(course_id, user_id)
        except NotFoundException:
            raise NotFoundException(
                "Course not found",
                code=ErrorCode.COURSE_NOT_FOUND,
            )

        # Check if course is already in path
        course_ids = path_data.get("course_ids", [])
        if course_id in course_ids:
            return LearningPath(**path_data)  # Already in path, no change

        # Add course
        course_ids.append(course_id)
        updated_data = await self.storage.update(
            "learning_paths",
            path_id,
            {
                "course_ids": course_ids,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Increment times_added for the course
        await self.course_service.increment_times_added(course_id)

        return LearningPath(**updated_data)

    async def remove_course_from_path(
        self, path_id: str, user_id: str, course_id: str
    ) -> LearningPath:
        """Remove a course from a learning path."""
        # Verify path ownership
        path_data = await self._get_owned_path(path_id, user_id)

        # Check if course is in path
        course_ids = path_data.get("course_ids", [])
        if course_id not in course_ids:
            raise NotFoundException(
                "Course not in learning path",
                code=ErrorCode.COURSE_NOT_FOUND,
            )

        # Remove course
        course_ids.remove(course_id)
        updated_data = await self.storage.update(
            "learning_paths",
            path_id,
            {
                "course_ids": course_ids,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Decrement times_added for the course
        await self.course_service.decrement_times_added(course_id)

        return LearningPath(**updated_data)

    async def reorder_courses(
        self, path_id: str, user_id: str, course_ids: list[str]
    ) -> LearningPath:
        """Reorder courses in a learning path."""
        # Verify path ownership
        path_data = await self._get_owned_path(path_id, user_id)

        # Verify the new list contains exactly the same courses
        existing_ids = set(path_data.get("course_ids", []))
        new_ids = set(course_ids)

        if existing_ids != new_ids:
            raise NotFoundException(
                "Course IDs don't match existing courses in path",
                code=ErrorCode.INVALID_MODULE_ORDER,
            )

        # Update order
        updated_data = await self.storage.update(
            "learning_paths",
            path_id,
            {
                "course_ids": course_ids,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        return LearningPath(**updated_data)

    # Private helpers

    async def _get_owned_path(self, path_id: str, user_id: str) -> dict:
        """Get a path and verify ownership."""
        path_data = await self.storage.get("learning_paths", path_id)

        if not path_data:
            raise NotFoundException(
                "Learning path not found",
                code=ErrorCode.LEARNING_PATH_NOT_FOUND,
            )

        if path_data.get("owner_id") != user_id:
            raise ForbiddenException(
                "Access denied",
                code=ErrorCode.ACCESS_DENIED,
            )

        return path_data

    def _to_response(self, path_data: dict) -> LearningPathResponse:
        """Convert path data to response model."""
        return LearningPathResponse(
            **path_data,
            course_count=len(path_data.get("course_ids", [])),
        )
