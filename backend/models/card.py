from datetime import datetime

from pydantic import BaseModel


class CardBase(BaseModel):
    front: str
    back: str
    visual_url: str | None = None


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    visual_url: str | None = None


class Card(CardBase):
    id: str
    deck_id: str
    created_at: datetime


class CardResponse(Card):
    pass
