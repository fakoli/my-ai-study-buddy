from datetime import datetime, timezone
from uuid import uuid4

from exceptions import ForbiddenException, NotFoundException
from models.card import Card, CardCreate, CardUpdate
from models.deck import Deck, DeckCreate, DeckResponse, DeckUpdate, DeckWithCards
from storage.base import StorageBackend


class DeckService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage

    async def list_decks(self, user_id: str) -> list[DeckResponse]:
        decks = await self.storage.list("decks", {"user_id": user_id})
        result = []
        for deck_data in decks:
            card_count = await self.storage.count("cards", {"deck_id": deck_data["id"]})
            result.append(
                DeckResponse(
                    id=deck_data["id"],
                    user_id=deck_data["user_id"],
                    title=deck_data["title"],
                    description=deck_data.get("description"),
                    created_at=datetime.fromisoformat(deck_data["created_at"])
                    if isinstance(deck_data["created_at"], str)
                    else deck_data["created_at"],
                    updated_at=datetime.fromisoformat(deck_data["updated_at"])
                    if isinstance(deck_data["updated_at"], str)
                    else deck_data["updated_at"],
                    card_count=card_count,
                )
            )
        return result

    async def create_deck(self, user_id: str, deck_data: DeckCreate) -> Deck:
        now = datetime.now(timezone.utc)
        deck = Deck(
            id=str(uuid4()),
            user_id=user_id,
            title=deck_data.title,
            description=deck_data.description,
            created_at=now,
            updated_at=now,
        )
        await self.storage.create("decks", deck.model_dump())
        return deck

    async def get_deck(self, deck_id: str, user_id: str) -> DeckWithCards:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        cards_data = await self.storage.list("cards", {"deck_id": deck_id})
        cards = [
            Card(
                id=c["id"],
                deck_id=c["deck_id"],
                front=c["front"],
                back=c["back"],
                visual_url=c.get("visual_url"),
                created_at=datetime.fromisoformat(c["created_at"])
                if isinstance(c["created_at"], str)
                else c["created_at"],
            )
            for c in cards_data
        ]

        return DeckWithCards(
            id=deck_data["id"],
            user_id=deck_data["user_id"],
            title=deck_data["title"],
            description=deck_data.get("description"),
            created_at=datetime.fromisoformat(deck_data["created_at"])
            if isinstance(deck_data["created_at"], str)
            else deck_data["created_at"],
            updated_at=datetime.fromisoformat(deck_data["updated_at"])
            if isinstance(deck_data["updated_at"], str)
            else deck_data["updated_at"],
            cards=cards,
        )

    async def update_deck(self, deck_id: str, user_id: str, update_data: DeckUpdate) -> Deck:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        updates = update_data.model_dump(exclude_unset=True)
        updates["updated_at"] = datetime.now(timezone.utc)

        updated = await self.storage.update("decks", deck_id, updates)
        return Deck(
            id=updated["id"],
            user_id=updated["user_id"],
            title=updated["title"],
            description=updated.get("description"),
            created_at=datetime.fromisoformat(updated["created_at"])
            if isinstance(updated["created_at"], str)
            else updated["created_at"],
            updated_at=datetime.fromisoformat(updated["updated_at"])
            if isinstance(updated["updated_at"], str)
            else updated["updated_at"],
        )

    async def delete_deck(self, deck_id: str, user_id: str) -> bool:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        cards = await self.storage.list("cards", {"deck_id": deck_id})
        for card in cards:
            await self.storage.delete("cards", card["id"])

        return await self.storage.delete("decks", deck_id)

    async def add_card(self, deck_id: str, user_id: str, card_data: CardCreate) -> Card:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        now = datetime.now(timezone.utc)
        card = Card(
            id=str(uuid4()),
            deck_id=deck_id,
            front=card_data.front,
            back=card_data.back,
            visual_url=card_data.visual_url,
            created_at=now,
        )
        await self.storage.create("cards", card.model_dump())

        await self.storage.update("decks", deck_id, {"updated_at": now})

        return card

    async def update_card(
        self, deck_id: str, card_id: str, user_id: str, update_data: CardUpdate
    ) -> Card:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        card_data = await self.storage.get("cards", card_id)
        if not card_data or card_data["deck_id"] != deck_id:
            raise NotFoundException("Card not found")

        updates = update_data.model_dump(exclude_unset=True)
        updated = await self.storage.update("cards", card_id, updates)

        await self.storage.update("decks", deck_id, {"updated_at": datetime.now(timezone.utc)})

        return Card(
            id=updated["id"],
            deck_id=updated["deck_id"],
            front=updated["front"],
            back=updated["back"],
            visual_url=updated.get("visual_url"),
            created_at=datetime.fromisoformat(updated["created_at"])
            if isinstance(updated["created_at"], str)
            else updated["created_at"],
        )

    async def delete_card(self, deck_id: str, card_id: str, user_id: str) -> bool:
        deck_data = await self.storage.get("decks", deck_id)
        if not deck_data:
            raise NotFoundException("Deck not found")
        if deck_data["user_id"] != user_id:
            raise ForbiddenException("Access denied")

        card_data = await self.storage.get("cards", card_id)
        if not card_data or card_data["deck_id"] != deck_id:
            raise NotFoundException("Card not found")

        result = await self.storage.delete("cards", card_id)

        await self.storage.update("decks", deck_id, {"updated_at": datetime.now(timezone.utc)})

        return result
