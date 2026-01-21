"""Flashcard rating models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class FlashcardRating(str, Enum):
    """Rating options for flashcards."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    UNHELPFUL = "unhelpful"


class FlashcardRatingRecord(BaseModel):
    """A user's rating for a specific flashcard."""

    id: str
    user_id: str
    course_id: str
    module_id: str
    flashcard_index: int  # Index of flashcard in module's flashcards array
    flashcard_id: str | None = None  # Optional flashcard ID if available
    rating: FlashcardRating
    created_at: datetime
    updated_at: datetime


class RateFlashcardRequest(BaseModel):
    """Request to rate a flashcard."""

    flashcard_index: int = Field(..., ge=0, description="Index of the flashcard in the module")
    flashcard_id: str | None = None
    rating: FlashcardRating


class FlashcardRatingResponse(BaseModel):
    """Response after rating a flashcard."""

    flashcard_index: int
    rating: FlashcardRating
    updated: bool  # True if rating was updated, False if new


class FlashcardRatingSummary(BaseModel):
    """Summary of ratings for a module's flashcards."""

    total: int
    unrated: int
    easy: int
    medium: int
    hard: int
    unhelpful: int


class FilteredFlashcard(BaseModel):
    """A flashcard with its rating status."""

    index: int
    id: str | None = None
    front: str
    back: str
    visual: str | None = None
    rating: FlashcardRating | None = None


class FilteredFlashcardsResponse(BaseModel):
    """Response containing filtered flashcards."""

    flashcards: list[FilteredFlashcard]
    filter_applied: str
    total: int


class UnhelpfulCardFeedback(BaseModel):
    """Feedback about a card marked as unhelpful (for course authors)."""

    module_id: str
    module_title: str
    flashcard_index: int
    flashcard_front: str
    flashcard_back: str
    unhelpful_count: int
    last_marked_at: datetime


class UnhelpfulCardsResponse(BaseModel):
    """Response containing cards marked as unhelpful for a course."""

    course_id: str
    unhelpful_cards: list[UnhelpfulCardFeedback]
    total: int
