from fastapi import APIRouter, Depends

from config import Settings, get_settings
from dependencies import CurrentUser, StorageDep
from services.ai_service import (
    AIResponse,
    AIService,
    ExamplesRequest,
    ExplainRequest,
    HintRequest,
    SimplifyRequest,
)

router = APIRouter()


def get_ai_service(storage: StorageDep, settings: Settings = Depends(get_settings)) -> AIService:
    return AIService(storage, settings)


@router.post("/explain", response_model=AIResponse)
async def explain(
    request: ExplainRequest,
    user: CurrentUser,
    ai_service: AIService = Depends(get_ai_service),
):
    """Get an AI explanation of a concept."""
    return await ai_service.explain(user.id, request)


@router.post("/hint", response_model=AIResponse)
async def hint(
    request: HintRequest,
    user: CurrentUser,
    ai_service: AIService = Depends(get_ai_service),
):
    """Get a progressive hint for a question."""
    return await ai_service.hint(user.id, request)


@router.post("/examples", response_model=AIResponse)
async def examples(
    request: ExamplesRequest,
    user: CurrentUser,
    ai_service: AIService = Depends(get_ai_service),
):
    """Generate examples for a concept."""
    return await ai_service.examples(user.id, request)


@router.post("/simplify", response_model=AIResponse)
async def simplify(
    request: SimplifyRequest,
    user: CurrentUser,
    ai_service: AIService = Depends(get_ai_service),
):
    """Simplify complex content."""
    return await ai_service.simplify(user.id, request)
