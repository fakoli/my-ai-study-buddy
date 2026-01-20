"""AI Generation API routes for course content creation."""

from fastapi import APIRouter, Depends

from config import Settings, get_settings
from dependencies import CurrentUser, StorageDep
from models.ai_generation import (
    GeneratedModuleContent,
    GeneratedVisual,
    GenerateFlashcardsRequest,
    GenerateFlashcardsResponse,
    GenerateModuleContentRequest,
    GenerateQuizRequest,
    GenerateQuizResponse,
    GenerateVisualRequest,
    SuggestModulesRequest,
    SuggestModulesResponse,
)
from services.ai_generation_service import AIGenerationService

router = APIRouter(prefix="/generate", tags=["generation"])


def get_generation_service(
    storage: StorageDep,
    settings: Settings = Depends(get_settings),
) -> AIGenerationService:
    """Dependency to create AIGenerationService instance."""
    return AIGenerationService(storage, settings)


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
