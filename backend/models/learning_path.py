from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LearningPathBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    thumbnail_url: str | None = None
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    estimated_hours: int | None = None


class LearningPathCreate(LearningPathBase):
    course_ids: list[str] = Field(default_factory=list)
    visibility: Literal["private", "unlisted", "public"] = "private"


class LearningPathUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None
    estimated_hours: int | None = None
    visibility: Literal["private", "unlisted", "public"] | None = None


class LearningPath(LearningPathBase):
    id: str
    owner_id: str
    course_ids: list[str] = Field(default_factory=list)
    visibility: Literal["private", "unlisted", "public"] = "private"
    created_at: datetime
    updated_at: datetime


class LearningPathResponse(LearningPath):
    course_count: int = 0


class AddCourseToPath(BaseModel):
    course_id: str


class ReorderCoursesInPath(BaseModel):
    course_ids: list[str]
