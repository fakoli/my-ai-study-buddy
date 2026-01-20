from datetime import datetime

from pydantic import BaseModel

from models.card import Card


class DeckBase(BaseModel):
    title: str
    description: str | None = None


class DeckCreate(DeckBase):
    pass


class DeckUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class Deck(DeckBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class DeckResponse(Deck):
    card_count: int = 0


class DeckWithCards(Deck):
    cards: list[Card] = []
