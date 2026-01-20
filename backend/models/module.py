from datetime import datetime

from pydantic import BaseModel, Field


class FlashcardData(BaseModel):
    """Flashcard within a module."""

    front: str
    back: str
    visual: str | None = None  # Relative path to visual


class QuizQuestionData(BaseModel):
    """Quiz question within a module."""

    question: str
    options: list[str] = Field(..., min_length=2, max_length=6)
    correct_index: int = Field(..., ge=0)
    explanation: str | None = None


class QuizData(BaseModel):
    """Quiz for a module."""

    questions: list[QuizQuestionData] = Field(default_factory=list)


class ModuleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    order_index: int = Field(..., ge=0)


class ModuleCreate(ModuleBase):
    content_markdown: str = ""
    flashcards: list[FlashcardData] = Field(default_factory=list)
    quiz: QuizData | None = None


class ModuleUpdate(BaseModel):
    title: str | None = None
    order_index: int | None = None
    content_markdown: str | None = None
    flashcards: list[FlashcardData] | None = None
    quiz: QuizData | None = None


class Module(ModuleBase):
    id: str
    course_id: str
    content_markdown: str = ""
    flashcards: list[FlashcardData] = Field(default_factory=list)
    quiz: QuizData | None = None
    created_at: datetime
    updated_at: datetime


class ModuleResponse(Module):
    """Module response with computed fields if needed."""

    pass


class ModuleSummary(BaseModel):
    """Lightweight module summary for listings."""

    id: str
    title: str
    order_index: int
    flashcard_count: int = 0
    has_quiz: bool = False


class GenerateModuleRequest(BaseModel):
    """Request to generate module content using AI."""

    prompt: str = Field(
        ..., min_length=10, description="Prompt describing what this module should cover"
    )
    generate_flashcards: bool = True
    flashcard_count: int = Field(default=15, ge=1, le=50)
    generate_quiz: bool = True
    quiz_question_count: int = Field(default=10, ge=1, le=30)
    generate_visuals: bool = True


class ModuleSuggestion(BaseModel):
    """AI-suggested module structure."""

    title: str
    description: str
    objectives: list[str]
    suggested: bool = True  # True if AI suggested, False if user-added
