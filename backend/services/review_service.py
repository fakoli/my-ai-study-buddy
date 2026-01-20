from datetime import datetime, timedelta, timezone
from uuid import uuid4

from exceptions import NotFoundException
from models.review import (
    CardWithDeck,
    Difficulty,
    DueCardsResponse,
    Review,
    ReviewCreate,
    ReviewHistoryItem,
    ReviewHistoryResponse,
)
from storage.base import StorageBackend
from utils.datetime_utils import ensure_datetime


class ReviewService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage

    def _calculate_next_review(self, difficulty: Difficulty, review_count: int = 0) -> datetime:
        """SM-2 simplified algorithm for spaced repetition."""
        now = datetime.now(timezone.utc)

        base_intervals = {
            Difficulty.EASY: [1, 3, 7, 14, 30, 60],
            Difficulty.MEDIUM: [1, 2, 4, 8, 16, 32],
            Difficulty.HARD: [0.25, 0.5, 1, 2, 4, 8],  # 0.25 = 6 hours
        }

        intervals = base_intervals[difficulty]
        interval_index = min(review_count, len(intervals) - 1)
        interval_days = intervals[interval_index]

        return now + timedelta(days=interval_days)

    async def submit_review(self, user_id: str, review_data: ReviewCreate) -> Review:
        card = await self.storage.get("cards", review_data.card_id)
        if not card:
            raise NotFoundException("Card not found")

        deck = await self.storage.get("decks", card["deck_id"])
        if not deck or deck["user_id"] != user_id:
            raise NotFoundException("Card not found")

        past_reviews = await self.storage.list(
            "reviews", {"user_id": user_id, "card_id": review_data.card_id}
        )
        review_count = len(past_reviews)

        now = datetime.now(timezone.utc)
        next_review_at = self._calculate_next_review(review_data.difficulty, review_count)

        review = Review(
            id=str(uuid4()),
            user_id=user_id,
            card_id=review_data.card_id,
            difficulty=review_data.difficulty,
            reviewed_at=now,
            next_review_at=next_review_at,
        )

        await self.storage.create("reviews", review.model_dump())

        card_review_data = await self.storage.get("card_reviews", review_data.card_id)
        if card_review_data:
            await self.storage.update(
                "card_reviews",
                review_data.card_id,
                {"next_review_at": next_review_at, "review_count": review_count + 1},
            )
        else:
            await self.storage.create(
                "card_reviews",
                {
                    "id": review_data.card_id,
                    "user_id": user_id,
                    "card_id": review_data.card_id,
                    "next_review_at": next_review_at,
                    "review_count": review_count + 1,
                },
            )

        return review

    async def get_due_cards(self, user_id: str, limit: int = 20) -> DueCardsResponse:
        """Get cards due for review."""
        now = datetime.now(timezone.utc)

        decks = await self.storage.list("decks", {"user_id": user_id})
        deck_map = {d["id"]: d for d in decks}

        cards_with_deck = []
        for deck_id in deck_map:
            cards = await self.storage.list("cards", {"deck_id": deck_id})
            for card in cards:
                card_review = await self.storage.get("card_reviews", card["id"])

                if card_review:
                    next_review = ensure_datetime(card_review.get("next_review_at"))
                    if next_review and next_review > now:
                        continue

                cards_with_deck.append(
                    CardWithDeck(
                        id=card["id"],
                        deck_id=card["deck_id"],
                        deck_title=deck_map[deck_id]["title"],
                        front=card["front"],
                        back=card["back"],
                        visual_url=card.get("visual_url"),
                        next_review_at=card_review.get("next_review_at") if card_review else None,
                    )
                )

        cards_with_deck.sort(
            key=lambda c: c.next_review_at or datetime.min.replace(tzinfo=timezone.utc)
        )

        return DueCardsResponse(
            cards=cards_with_deck[:limit],
            total_due=len(cards_with_deck),
        )

    async def get_review_history(
        self, user_id: str, limit: int = 50, offset: int = 0
    ) -> ReviewHistoryResponse:
        """Get review history for a user."""
        reviews = await self.storage.list("reviews", {"user_id": user_id})

        reviews.sort(
            key=lambda r: ensure_datetime(r["reviewed_at"]) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        history_items = []
        for review in reviews[offset : offset + limit]:
            card = await self.storage.get("cards", review["card_id"])
            if card:
                history_items.append(
                    ReviewHistoryItem(
                        id=review["id"],
                        card_id=review["card_id"],
                        card_front=card["front"],
                        difficulty=review["difficulty"],
                        reviewed_at=ensure_datetime(review["reviewed_at"]),
                    )
                )

        return ReviewHistoryResponse(
            reviews=history_items,
            total=len(reviews),
        )
