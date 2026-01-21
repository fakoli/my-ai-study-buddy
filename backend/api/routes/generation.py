"""AI Generation API routes for course content creation."""

from fastapi import APIRouter, Depends

from config import Settings, get_settings
from dependencies import CurrentUser, StorageDep
from models.ai_generation import (
    GeneratedModuleContent,
    GeneratedVisual,
    GenerateFlashcardsRequest,
    GenerateFlashcardsResponse,
    GenerateFullCourseRequest,
    GenerateFullCourseResponse,
    GenerateModuleContentRequest,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GenerateVisualRequest,
    ModuleGenerationStatus,
    SuggestModulesRequest,
    SuggestModulesResponse,
)
from services.ai_generation_service import AIGenerationService
from services.course_orchestrator import (
    CourseOrchestrator,
    GenerationOptions,
    get_course_orchestrator,
)

router = APIRouter(prefix="/generate", tags=["generation"])


def get_generation_service(
    storage: StorageDep,
    settings: Settings = Depends(get_settings),
) -> AIGenerationService:
    """Dependency to create AIGenerationService instance."""
    return AIGenerationService(storage, settings)


def get_orchestrator(
    storage: StorageDep,
    settings: Settings = Depends(get_settings),
) -> CourseOrchestrator:
    """Dependency to create CourseOrchestrator instance."""
    return get_course_orchestrator(storage, settings)


@router.post("/suggest-modules", response_model=SuggestModulesResponse)
async def suggest_modules(
    request: SuggestModulesRequest,
    user: CurrentUser,
    service: AIGenerationService = Depends(get_generation_service),
) -> SuggestModulesResponse:
    """Generate suggested module structure for an AI-enabled course.

    Uses the course's instructions (purpose, audience, objectives) to suggest
    a logical module structure.

    Token cost: 10
    """
    return await service.suggest_modules(user.id, request)


@router.post("/module-content", response_model=GeneratedModuleContent)
async def generate_module_content(
    request: GenerateModuleContentRequest,
    user: CurrentUser,
    service: AIGenerationService = Depends(get_generation_service),
) -> GeneratedModuleContent:
    """Generate full module content including markdown, flashcards, and quiz.

    Uses the course's instructions and the provided module prompt to generate
    comprehensive learning content.

    Token cost: 25
    """
    return await service.generate_module_content(user.id, request)


@router.post("/flashcards", response_model=GenerateFlashcardsResponse)
async def generate_flashcards(
    request: GenerateFlashcardsRequest,
    user: CurrentUser,
    service: AIGenerationService = Depends(get_generation_service),
) -> GenerateFlashcardsResponse:
    """Generate flashcards from existing module content.

    Creates flashcards based on the module's markdown content and the
    course's instructions.

    Token cost: 8
    """
    return await service.generate_flashcards(user.id, request)


@router.post("/quiz", response_model=GenerateQuizResponse)
async def generate_quiz(
    request: GenerateQuizRequest,
    user: CurrentUser,
    service: AIGenerationService = Depends(get_generation_service),
) -> GenerateQuizResponse:
    """Generate a quiz from existing module content.

    Creates multiple-choice questions based on the module's content
    and existing flashcards.

    Token cost: 10
    """
    return await service.generate_quiz(user.id, request)


@router.post("/visual", response_model=GeneratedVisual)
async def generate_visual(
    request: GenerateVisualRequest,
    user: CurrentUser,
    service: AIGenerationService = Depends(get_generation_service),
) -> GeneratedVisual:
    """Generate an educational visual using AI image generation.

    Uses nano-banana-pro (Gemini) to create diagrams, illustrations,
    and other educational visuals.

    Token cost: 5
    """
    return await service.generate_visual(user.id, request)


@router.post("/full-course", response_model=GenerateFullCourseResponse)
async def generate_full_course(
    request: GenerateFullCourseRequest,
    user: CurrentUser,
    orchestrator: CourseOrchestrator = Depends(get_orchestrator),
) -> GenerateFullCourseResponse:
    """Generate complete course content with parallel execution.

    Uses a multi-phase pipeline to generate:
    1. Module structure (planning phase)
    2. Module content in parallel (content phase)
    3. Flashcards and quizzes (enrichment phase)
    4. Educational visuals (optional, visuals phase)
    5. Save all content to database (finalization phase)

    Token cost: Variable (depends on module count and options)
    - Planning: ~10 tokens
    - Content: ~25 tokens per module
    - Visuals: ~5 tokens per visual (if enabled)

    Example estimated cost for 8 modules with visuals:
    10 + (8 × 25) + (8 × 2 × 5) = 290 tokens

    Expected latency reduction: 60-70% compared to sequential generation.
    """
    # Build options from request
    options = GenerationOptions(
        suggest_modules=request.suggest_modules,
        module_count=request.module_count,
        generate_content=request.generate_content,
        max_concurrent_modules=request.max_concurrent_modules,
        generate_flashcards=request.generate_flashcards,
        flashcard_count_per_module=request.flashcard_count_per_module,
        generate_quiz=request.generate_quiz,
        quiz_questions_per_module=request.quiz_questions_per_module,
        generate_visuals=request.generate_visuals,
        max_visuals_per_module=request.max_visuals_per_module,
    )

    # Run generation pipeline
    result = await orchestrator.generate_full_course(
        user_id=user.id,
        course_id=request.course_id,
        options=options,
        module_suggestions=request.module_suggestions,
    )

    # Convert to response model
    module_statuses = [
        ModuleGenerationStatus(
            module_id=mr.module_id,
            title=mr.title,
            success=mr.success,
            tokens_used=mr.tokens_used,
            error=mr.error,
            flashcard_count=len(mr.flashcards),
            has_quiz=mr.quiz is not None,
        )
        for mr in result.module_results
    ]

    return GenerateFullCourseResponse(
        course_id=result.course_id,
        phase=result.phase.value,
        modules_generated=result.modules_generated,
        modules_failed=result.modules_failed,
        total_tokens_used=result.total_tokens_used,
        visuals_generated=result.visuals_generated,
        visuals_failed=result.visuals_failed,
        module_statuses=module_statuses,
        error=result.error,
        duration_seconds=result.duration_seconds,
    )
