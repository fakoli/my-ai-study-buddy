"""Models for AI-powered content generation."""

from typing import Literal

from pydantic import BaseModel, Field

from models.module import FlashcardData, QuizData


class ModuleSuggestion(BaseModel):
    """AI-suggested module for a course."""

    title: str
    description: str
    objectives: list[str] = Field(default_factory=list)
    suggested: bool = True  # True if AI suggested, False if user-added


class SuggestModulesRequest(BaseModel):
    """Request to generate module suggestions for a course."""

    course_id: str = Field(..., description="Course ID to suggest modules for")


class SuggestModulesResponse(BaseModel):
    """Response containing module suggestions."""

    suggestions: list[ModuleSuggestion]
    tokens_used: int


class GenerateModuleContentRequest(BaseModel):
    """Request to generate full module content."""

    course_id: str = Field(..., description="Course ID the module belongs to")
    module_title: str = Field(..., min_length=1, description="Title for the module")
    module_prompt: str = Field(
        ..., min_length=10, description="Prompt describing what this module should cover"
    )
    generate_flashcards: bool = True
    flashcard_count: int = Field(default=15, ge=1, le=50)
    generate_quiz: bool = True
    quiz_question_count: int = Field(default=10, ge=1, le=30)


class GeneratedModuleContent(BaseModel):
    """Generated content for a module."""

    content_markdown: str
    flashcards: list[FlashcardData] = Field(default_factory=list)
    quiz: QuizData | None = None
    suggested_visuals: list[str] = Field(
        default_factory=list, description="Descriptions for images to generate"
    )
    tokens_used: int


class GenerateFlashcardsRequest(BaseModel):
    """Request to generate flashcards from module content."""

    course_id: str = Field(..., description="Course ID for context")
    module_id: str = Field(..., description="Module ID to generate flashcards for")
    count: int = Field(default=15, ge=1, le=50, description="Number of flashcards to generate")


class GenerateFlashcardsResponse(BaseModel):
    """Response containing generated flashcards."""

    flashcards: list[FlashcardData]
    tokens_used: int


class GenerateQuizRequest(BaseModel):
    """Request to generate a quiz from module content."""

    course_id: str = Field(..., description="Course ID for context")
    module_id: str = Field(..., description="Module ID to generate quiz for")
    question_count: int = Field(default=10, ge=1, le=30, description="Number of questions")


class GenerateQuizResponse(BaseModel):
    """Response containing generated quiz."""

    quiz: QuizData
    tokens_used: int


class GenerateVisualRequest(BaseModel):
    """Request to generate a visual/image using AI."""

    course_id: str = Field(..., description="Course ID for storage path")
    module_id: str = Field(..., description="Module ID for storage path")
    description: str = Field(
        ..., min_length=10, description="Description of the image to generate"
    )
    style: Literal[
        "educational_diagram",
        "technical_illustration",
        "flowchart",
        "infographic",
        "conceptual",
    ] = Field(default="educational_diagram")
    model: Literal["flash", "pro"] = Field(
        default="flash", description="Image model: flash (fast) or pro (high quality)"
    )
    aspect: Literal["square", "landscape", "portrait"] = Field(default="landscape")


class GeneratedVisual(BaseModel):
    """Generated visual/image result."""

    description: str
    local_path: str
    url: str  # URL to access the image via API
    markdown_reference: str  # e.g., ![diagram](url)
    tokens_used: int
