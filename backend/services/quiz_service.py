import random
from datetime import datetime, timezone
from uuid import uuid4

from exceptions import NotFoundException, ValidationException
from models.quiz import (
    QuestionResult,
    Quiz,
    QuizGenerateRequest,
    QuizQuestion,
    QuizSubmission,
    QuizSubmitRequest,
    QuizWithSubmission,
)
from storage.base import StorageBackend


class QuizService:
    def __init__(self, storage: StorageBackend):
        self.storage = storage

    async def generate_quiz(self, user_id: str, request: QuizGenerateRequest) -> Quiz:
        """Generate a quiz from cards in a deck or topic."""
        if not request.deck_id and not request.topic:
            raise ValidationException("Either deck_id or topic must be provided")

        cards = []

        if request.deck_id:
            deck = await self.storage.get("decks", request.deck_id)
            if not deck or deck["user_id"] != user_id:
                raise NotFoundException("Deck not found")

            cards = await self.storage.list("cards", {"deck_id": request.deck_id})

        if not cards:
            raise ValidationException("No cards available for quiz generation")

        if len(cards) < request.num_questions:
            selected_cards = cards
        else:
            selected_cards = random.sample(cards, request.num_questions)

        questions = []
        for card in selected_cards:
            all_cards = await self.storage.list("cards", {"deck_id": card["deck_id"]})
            wrong_answers = [c["back"] for c in all_cards if c["id"] != card["id"]]

            if len(wrong_answers) >= 3:
                distractors = random.sample(wrong_answers, 3)
            else:
                distractors = wrong_answers + [f"Option {i}" for i in range(3 - len(wrong_answers))]

            options = distractors + [card["back"]]
            random.shuffle(options)
            correct_index = options.index(card["back"])

            questions.append(
                QuizQuestion(
                    id=str(uuid4()),
                    question=card["front"],
                    options=options,
                    correct_index=correct_index,
                    explanation=None,
                )
            )

        quiz = Quiz(
            id=str(uuid4()),
            user_id=user_id,
            deck_id=request.deck_id,
            topic=request.topic,
            questions=questions,
            created_at=datetime.now(timezone.utc),
        )

        await self.storage.create("quizzes", quiz.model_dump())

        return quiz

    async def submit_quiz(self, user_id: str, request: QuizSubmitRequest) -> QuizSubmission:
        """Submit answers and score a quiz."""
        quiz_data = await self.storage.get("quizzes", request.quiz_id)
        if not quiz_data or quiz_data["user_id"] != user_id:
            raise NotFoundException("Quiz not found")

        questions = quiz_data["questions"]
        if len(request.answers) != len(questions):
            raise ValidationException(
                f"Expected {len(questions)} answers, got {len(request.answers)}"
            )

        results = []
        correct_count = 0

        for i, question in enumerate(questions):
            is_correct = request.answers[i] == question["correct_index"]
            if is_correct:
                correct_count += 1

            results.append(
                QuestionResult(
                    question_id=question["id"],
                    selected=request.answers[i],
                    correct=question["correct_index"],
                    is_correct=is_correct,
                )
            )

        score = (correct_count / len(questions)) * 100 if questions else 0

        submission = QuizSubmission(
            id=str(uuid4()),
            quiz_id=request.quiz_id,
            user_id=user_id,
            answers=request.answers,
            submitted_at=datetime.now(timezone.utc),
            score=score,
            results=results,
        )

        await self.storage.create("quiz_submissions", submission.model_dump())

        return submission

    async def get_quiz(self, quiz_id: str, user_id: str) -> QuizWithSubmission:
        """Get a quiz with its submission if exists."""
        quiz_data = await self.storage.get("quizzes", quiz_id)
        if not quiz_data or quiz_data["user_id"] != user_id:
            raise NotFoundException("Quiz not found")

        submissions = await self.storage.list("quiz_submissions", {"quiz_id": quiz_id})
        submission = None
        if submissions:
            sub_data = submissions[0]
            submission = QuizSubmission(
                id=sub_data["id"],
                quiz_id=sub_data["quiz_id"],
                user_id=sub_data["user_id"],
                answers=sub_data["answers"],
                submitted_at=datetime.fromisoformat(sub_data["submitted_at"])
                if isinstance(sub_data["submitted_at"], str)
                else sub_data["submitted_at"],
                score=sub_data["score"],
                results=[QuestionResult(**r) for r in sub_data["results"]],
            )

        questions = [QuizQuestion(**q) for q in quiz_data["questions"]]

        return QuizWithSubmission(
            id=quiz_data["id"],
            user_id=quiz_data["user_id"],
            deck_id=quiz_data.get("deck_id"),
            topic=quiz_data.get("topic"),
            questions=questions,
            created_at=datetime.fromisoformat(quiz_data["created_at"])
            if isinstance(quiz_data["created_at"], str)
            else quiz_data["created_at"],
            submission=submission,
        )
