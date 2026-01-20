from datetime import datetime, timedelta, timezone
from uuid import uuid4

from models.progress import ProgressStats, Session, SessionsResponse, TopicMastery, TopicMasteryResponse
from storage.base import StorageBackend
from utils.datetime_utils import ensure_datetime


class ProgressService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage

    async def get_stats(self, user_id: str) -> ProgressStats:
        """Get overall progress statistics for a user."""
        reviews = await self.storage.list("reviews", {"user_id": user_id})
        submissions = await self.storage.list("quiz_submissions", {"user_id": user_id})

        total_cards_reviewed = len(reviews)
        total_quizzes_completed = len(submissions)

        correct_answers = sum(
            sum(1 for r in s.get("results", []) if r.get("is_correct", False))
            for s in submissions
        )
        total_answers = sum(len(s.get("results", [])) for s in submissions)
        accuracy_rate = (correct_answers / total_answers * 100) if total_answers > 0 else 0.0

        streak_data = await self._calculate_streak(user_id)

        sessions = await self.storage.list("sessions", {"user_id": user_id})
        time_spent = sum(
            self._calculate_session_duration(s) for s in sessions
        )

        return ProgressStats(
            user_id=user_id,
            total_cards_reviewed=total_cards_reviewed,
            total_quizzes_completed=total_quizzes_completed,
            accuracy_rate=round(accuracy_rate, 2),
            current_streak=streak_data["current"],
            longest_streak=streak_data["longest"],
            time_spent_minutes=time_spent,
        )

    async def _calculate_streak(self, user_id: str) -> dict:
        """Calculate current and longest streak from activity."""
        reviews = await self.storage.list("reviews", {"user_id": user_id})
        submissions = await self.storage.list("quiz_submissions", {"user_id": user_id})

        activity_dates = set()

        for r in reviews:
            reviewed_at = ensure_datetime(r.get("reviewed_at"))
            if reviewed_at:
                activity_dates.add(reviewed_at.date())

        for s in submissions:
            submitted_at = ensure_datetime(s.get("submitted_at"))
            if submitted_at:
                activity_dates.add(submitted_at.date())

        if not activity_dates:
            return {"current": 0, "longest": 0}

        sorted_dates = sorted(activity_dates)

        longest_streak = 1
        current_streak = 1
        streak = 1

        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                streak += 1
                longest_streak = max(longest_streak, streak)
            else:
                streak = 1

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        if sorted_dates[-1] == today or sorted_dates[-1] == yesterday:
            streak = 1
            for i in range(len(sorted_dates) - 1, 0, -1):
                if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                    streak += 1
                else:
                    break
            current_streak = streak
        else:
            current_streak = 0

        return {"current": current_streak, "longest": longest_streak}

    def _calculate_session_duration(self, session: dict) -> int:
        """Calculate session duration in minutes."""
        started = ensure_datetime(session.get("started_at"))
        ended = ensure_datetime(session.get("ended_at"))

        if not started or not ended:
            return 0

        duration = (ended - started).total_seconds() / 60
        return int(duration)

    async def get_sessions(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> SessionsResponse:
        """Get session history."""
        sessions = await self.storage.list("sessions", {"user_id": user_id})

        sessions.sort(
            key=lambda s: ensure_datetime(s["started_at"]) or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        session_list = [
            Session(
                id=s["id"],
                user_id=s["user_id"],
                started_at=ensure_datetime(s["started_at"]),
                ended_at=ensure_datetime(s.get("ended_at")),
                activity_type=s["activity_type"],
                items_completed=s.get("items_completed", 0),
            )
            for s in sessions[offset : offset + limit]
        ]

        return SessionsResponse(sessions=session_list, total=len(sessions))

    async def start_session(self, user_id: str, activity_type: str) -> Session:
        """Start a new learning session."""
        session = Session(
            id=str(uuid4()),
            user_id=user_id,
            started_at=datetime.now(timezone.utc),
            ended_at=None,
            activity_type=activity_type,
            items_completed=0,
        )

        await self.storage.create("sessions", session.model_dump())
        return session

    async def end_session(self, session_id: str, items_completed: int) -> Session:
        """End a learning session."""
        session_data = await self.storage.get("sessions", session_id)
        if not session_data:
            raise ValueError("Session not found")

        now = datetime.now(timezone.utc)
        await self.storage.update(
            "sessions", session_id, {"ended_at": now, "items_completed": items_completed}
        )

        session_data["ended_at"] = now
        session_data["items_completed"] = items_completed

        return Session(
            id=session_data["id"],
            user_id=session_data["user_id"],
            started_at=ensure_datetime(session_data["started_at"]),
            ended_at=now,
            activity_type=session_data["activity_type"],
            items_completed=items_completed,
        )

    async def get_topic_mastery(self, user_id: str) -> TopicMasteryResponse:
        """Get mastery level per deck/topic."""
        decks = await self.storage.list("decks", {"user_id": user_id})

        topics = []
        for deck in decks:
            cards = await self.storage.list("cards", {"deck_id": deck["id"]})
            total_cards = len(cards)

            mastered_count = 0
            last_reviewed = None

            for card in cards:
                card_review = await self.storage.get("card_reviews", card["id"])
                if card_review:
                    review_count = card_review.get("review_count", 0)
                    if review_count >= 3:
                        mastered_count += 1

                    next_review = ensure_datetime(card_review.get("next_review_at"))
                    if next_review:
                        if not last_reviewed or next_review > last_reviewed:
                            last_reviewed = next_review

            mastery_percentage = (mastered_count / total_cards * 100) if total_cards > 0 else 0

            topics.append(
                TopicMastery(
                    topic=deck["title"],
                    deck_id=deck["id"],
                    total_cards=total_cards,
                    mastered_cards=mastered_count,
                    mastery_percentage=round(mastery_percentage, 2),
                    last_reviewed=last_reviewed,
                )
            )

        return TopicMasteryResponse(topics=topics)
