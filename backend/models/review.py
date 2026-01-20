from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ReviewCreate(BaseModel):
    card_id: str
    difficulty: Difficulty


class Review(BaseModel):
    id: str
    user_id: str
    card_id: str
    difficulty: Difficulty
    reviewed_at: datetime
    next_review_at: datetime


class ReviewResponse(Review):
    pass


class DueCardsResponse(BaseModel):
    cards: list["CardWithDeck"]
    total_due: int


class CardWithDeck(BaseModel):
    id: str
    deck_id: str
    deck_title: str
    front: str
    back: str
    visual_url: str | None = None
    next_review_at: datetime | None = None


class ReviewHistoryItem(BaseModel):
    id: str
    card_id: str
    card_front: str
    difficulty: Difficulty
    reviewed_at: datetime


class ReviewHistoryResponse(BaseModel):
    reviews: list[ReviewHistoryItem]
    total: int
