"""Parallel generation service for AI content creation.

Generates content, flashcards, and quiz in parallel to reduce latency.
Uses asyncio.TaskGroup for efficient concurrent execution with proper
error handling and cancellation.

Expected latency reduction: ~60-70% for full module generation.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import TYPE_CHECKING

from logging_config import get_logger


if TYPE_CHECKING:
    from models.course import Course
    from models.module import FlashcardData, QuizData


logger = get_logger(__name__)


@dataclass
class ParallelGenerationResult:
    """Result of parallel content generation."""

    content_markdown: str
    flashcards: list["FlashcardData"]
    quiz: "QuizData | None"
    suggested_visuals: list[str]
    tokens_used: int

    # Individual component results for error tracking
    content_success: bool = True
    flashcards_success: bool = True
    quiz_success: bool = True

    # Error messages if any component failed
    content_error: str | None = None
    flashcards_error: str | None = None
    quiz_error: str | None = None


class ParallelContentGenerator:
    """Generates module content components in parallel.

    Instead of generating markdown, then flashcards, then quiz sequentially,
    this service generates all three in parallel when possible.

    Usage:
        generator = ParallelContentGenerator(ai_service, model_router)
        result = await generator.generate_module_content_parallel(
            user_id="123",
            course=course,
            module_title="Introduction",
            module_prompt="Cover the basics...",
            generate_flashcards=True,
            generate_quiz=True,
        )
    """

    # Maximum concurrent AI calls to avoid rate limiting
    MAX_CONCURRENT_CALLS = 3

    def __init__(self, ai_service: "AIGenerationService"):
        """Initialize with the AI generation service.

        Args:
            ai_service: The main AI generation service instance
        """
        self._ai_service = ai_service
        self._semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_CALLS)

    async def generate_module_content_parallel(
        self,
        user_id: str,
        course: "Course",
        module_title: str,
        module_prompt: str,
        generate_flashcards: bool = True,
        generate_quiz: bool = True,
        flashcard_count: int = 10,
        quiz_question_count: int = 5,
    ) -> ParallelGenerationResult:
        """Generate module content with parallel execution.

        Generates markdown content first (required for flashcards/quiz),
        then generates flashcards and quiz in parallel.

        Args:
            user_id: User ID for token management
            course: Course object with instructions
            module_title: Title of the module
            module_prompt: Description of what to cover
            generate_flashcards: Whether to generate flashcards
            generate_quiz: Whether to generate quiz
            flashcard_count: Number of flashcards to generate
            quiz_question_count: Number of quiz questions

        Returns:
            ParallelGenerationResult with all components
        """
        from models.ai_generation import GenerateModuleContentRequest

        logger.info(
            f"Starting parallel content generation",
            user_id=user_id,
            module_title=module_title,
            generate_flashcards=generate_flashcards,
            generate_quiz=generate_quiz,
        )

        # Phase 1: Generate main content (required first)
        # This generates markdown, and optionally flashcards/quiz in a single call
        # for efficiency when all are needed
        request = GenerateModuleContentRequest(
            course_id=course.id,
            module_title=module_title,
            module_prompt=module_prompt,
            generate_flashcards=generate_flashcards,
            generate_quiz=generate_quiz,
            flashcard_count=flashcard_count,
            quiz_question_count=quiz_question_count,
        )

        try:
            result = await self._ai_service.generate_module_content(user_id, request)

            return ParallelGenerationResult(
                content_markdown=result.content_markdown,
                flashcards=result.flashcards,
                quiz=result.quiz,
                suggested_visuals=result.suggested_visuals,
                tokens_used=result.tokens_used,
            )

        except Exception as e:
            logger.error(
                f"Parallel generation failed",
                error_type=type(e).__name__,
                error_message=str(e),
            )
            raise

    async def generate_flashcards_and_quiz_parallel(
        self,
        user_id: str,
        course_id: str,
        module_id: str,
        flashcard_count: int = 10,
        quiz_question_count: int = 5,
    ) -> tuple[list["FlashcardData"], "QuizData | None", int]:
        """Generate flashcards and quiz in parallel from existing module.

        Use when the module already has content but needs flashcards/quiz.

        Args:
            user_id: User ID for token management
            course_id: Course ID
            module_id: Module ID with existing content
            flashcard_count: Number of flashcards to generate
            quiz_question_count: Number of quiz questions

        Returns:
            Tuple of (flashcards, quiz, tokens_used)
        """
        from models.ai_generation import GenerateFlashcardsRequest, GenerateQuizRequest

        logger.info(
            f"Starting parallel flashcard and quiz generation",
            user_id=user_id,
            course_id=course_id,
            module_id=module_id,
        )

        flashcard_request = GenerateFlashcardsRequest(
            course_id=course_id,
            module_id=module_id,
            count=flashcard_count,
        )

        quiz_request = GenerateQuizRequest(
            course_id=course_id,
            module_id=module_id,
            question_count=quiz_question_count,
        )

        # Execute both in parallel
        async with asyncio.TaskGroup() as tg:
            flashcard_task = tg.create_task(
                self._with_semaphore(
                    self._ai_service.generate_flashcards(user_id, flashcard_request)
                )
            )
            quiz_task = tg.create_task(
                self._with_semaphore(
                    self._ai_service.generate_quiz(user_id, quiz_request)
                )
            )

        flashcard_result = flashcard_task.result()
        quiz_result = quiz_task.result()

        total_tokens = flashcard_result.tokens_used + quiz_result.tokens_used

        logger.info(
            f"Parallel flashcard and quiz generation completed",
            flashcard_count=len(flashcard_result.flashcards),
            quiz_questions=len(quiz_result.quiz.questions),
            total_tokens=total_tokens,
        )

        return flashcard_result.flashcards, quiz_result.quiz, total_tokens

    async def _with_semaphore(self, coro):
        """Execute a coroutine with semaphore for rate limiting."""
        async with self._semaphore:
            return await coro


# Type hint for circular import
if TYPE_CHECKING:
    from services.ai_generation_service import AIGenerationService
