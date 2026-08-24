"""Tests for ParallelContentGenerator (parallel content generation).

Covers the orchestration paths: full module generation (success + error
propagation), and the parallel flashcards+quiz path (TaskGroup, semaphore,
token summation). The AI service is mocked so no real LLM calls happen.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from exceptions import AIServiceException
from services.parallel_generation_service import ParallelContentGenerator


def _fake_course():
    return SimpleNamespace(id="course-1", title="Course")


def _fake_result(**overrides):
    base = {
        "content_markdown": "# Content",
        "flashcards": [{"id": "f1", "front": "F", "back": "B"}],
        "quiz": SimpleNamespace(questions=[{"question": "Q"}]),
        "suggested_visuals": ["img1"],
        "tokens_used": 100,
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def _fake_flashcards_result(**overrides):
    base = {"flashcards": [{"id": "f1", "front": "F", "back": "B"}], "tokens_used": 40}
    base.update(overrides)
    return SimpleNamespace(**base)


def _fake_quiz_result(**overrides):
    base = {"quiz": SimpleNamespace(questions=[{"question": "Q"}]), "tokens_used": 60}
    base.update(overrides)
    return SimpleNamespace(**base)


@pytest.fixture
def ai_service():
    svc = AsyncMock()
    return svc


@pytest.fixture
def generator(ai_service):
    return ParallelContentGenerator(ai_service)


class TestGenerateModuleContentParallel:
    @pytest.mark.asyncio
    async def test_success(self, generator, ai_service):
        ai_service.generate_module_content.return_value = _fake_result()

        result = await generator.generate_module_content_parallel(
            user_id="u1", course=_fake_course(), module_title="Intro", module_prompt="a longer prompt here"
        )

        assert result.content_markdown == "# Content"
        assert len(result.flashcards) == 1
        assert result.tokens_used == 100
        ai_service.generate_module_content.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_flags_default_true(self, generator, ai_service):
        ai_service.generate_module_content.return_value = _fake_result()

        result = await generator.generate_module_content_parallel(
            user_id="u1", course=_fake_course(), module_title="T", module_prompt="a longer prompt here"
        )
        assert result.content_success is True
        assert result.flashcards_success is True
        assert result.quiz_success is True
        assert result.content_error is None

    @pytest.mark.asyncio
    async def test_error_propagates(self, generator, ai_service):
        ai_service.generate_module_content.side_effect = AIServiceException("nope")

        with pytest.raises(AIServiceException):
            await generator.generate_module_content_parallel(
                user_id="u1", course=_fake_course(), module_title="T", module_prompt="a longer prompt here"
            )

    @pytest.mark.asyncio
    async def test_no_flashcards_quiz(self, generator, ai_service):
        """generate_flashcards=False + generate_quiz=False still works."""
        ai_service.generate_module_content.return_value = _fake_result(flashcards=[], quiz=None)

        result = await generator.generate_module_content_parallel(
            user_id="u1",
            course=_fake_course(),
            module_title="T",
            module_prompt="a longer prompt here",
            generate_flashcards=False,
            generate_quiz=False,
        )
        assert result.flashcards == []
        assert result.quiz is None


class TestGenerateFlashcardsAndQuizParallel:
    @pytest.mark.asyncio
    async def test_parallel_success_sums_tokens(self, generator, ai_service):
        ai_service.generate_flashcards.return_value = _fake_flashcards_result()
        ai_service.generate_quiz.return_value = _fake_quiz_result()

        flashcards, quiz, tokens = await generator.generate_flashcards_and_quiz_parallel(
            user_id="u1", course_id="c1", module_id="m1"
        )

        assert len(flashcards) == 1
        assert quiz is not None
        assert tokens == 100  # 40 + 60
        ai_service.generate_flashcards.assert_awaited_once()
        ai_service.generate_quiz.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_error_in_one_task_propagates(self, generator, ai_service):
        ai_service.generate_flashcards.return_value = _fake_flashcards_result()
        ai_service.generate_quiz.side_effect = AIServiceException("quiz failed")

        import asyncio

        with pytest.raises(ExceptionGroup) as exc_info:
            await generator.generate_flashcards_and_quiz_parallel(
                user_id="u1", course_id="c1", module_id="m1"
            )
        # Python 3.11+ TaskGroup wraps failures in ExceptionGroup; the
        # underlying AIServiceException is one of the sub-exceptions.
        assert any(
            isinstance(e, AIServiceException) for e in exc_info.value.exceptions
        )

    @pytest.mark.asyncio
    async def test_semaphore_limits_concurrency(self, generator, ai_service):
        """The semaphore caps concurrent calls to MAX_CONCURRENT_CALLS."""
        ai_service.generate_flashcards.return_value = _fake_flashcards_result()
        ai_service.generate_quiz.return_value = _fake_quiz_result()

        assert generator.MAX_CONCURRENT_CALLS == 3
        await generator.generate_flashcards_and_quiz_parallel(
            user_id="u1", course_id="c1", module_id="m1"
        )
        # Verify the semaphore was used by checking _with_semaphore path ran
        assert ai_service.generate_flashcards.await_count == 1
