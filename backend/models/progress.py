from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ProgressStats(BaseModel):
    user_id: str
    total_cards_reviewed: int
    total_quizzes_completed: int
    accuracy_rate: float
    current_streak: int
    longest_streak: int
    time_spent_minutes: int


class Session(BaseModel):
    id: str
    user_id: str
    started_at: datetime
    ended_at: datetime | None = None
    activity_type: Literal["review", "quiz", "reference"]
    items_completed: int = 0


class SessionResponse(Session):
    pass


class SessionsResponse(BaseModel):
    sessions: list[Session]
    total: int


class TopicMastery(BaseModel):
    topic: str
    deck_id: str | None = None
    total_cards: int
    mastered_cards: int
    mastery_percentage: float
    last_reviewed: datetime | None = None


class TopicMasteryResponse(BaseModel):
    topics: list[TopicMastery]
