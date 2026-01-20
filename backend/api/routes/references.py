from fastapi import APIRouter, Query

from services.reference_service import (
    ReferenceContent,
    ReferencesResponse,
    ReferenceService,
    ReferenceVisualsResponse,
)

router = APIRouter()


def get_reference_service() -> ReferenceService:
    return ReferenceService()


@router.get("", response_model=ReferencesResponse)
async def list_references():
    """List all available reference materials."""
    service = get_reference_service()
    return await service.list_references()


@router.get("/{topic}", response_model=ReferenceContent)
async def get_reference(
    topic: str,
    module: str | None = Query(None),
):
    """Get reference content for a topic."""
    service = get_reference_service()
    return await service.get_reference(topic, module)


@router.get("/{topic}/visuals", response_model=ReferenceVisualsResponse)
async def get_visuals(
    topic: str,
    module: str | None = Query(None),
):
    """Get visual aids for a topic."""
    service = get_reference_service()
    return await service.get_visuals(topic, module)
