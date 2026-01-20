from fastapi import APIRouter, Depends, Query

from dependencies import CurrentUser, StorageDep
from models.progress import ProgressStats, SessionsResponse, TopicMasteryResponse
from services.progress_service import ProgressService

router = APIRouter()


def get_progress_service(storage: StorageDep) -> ProgressService:
    return ProgressService(storage)


@router.get("/stats", response_model=ProgressStats)
async def get_stats(
    user: CurrentUser,
    progress_service: ProgressService = Depends(get_progress_service),
):
    """Get overall progress statistics."""
    return await progress_service.get_stats(user.id)


@router.get("/sessions", response_model=SessionsResponse)
async def get_sessions(
    user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    progress_service: ProgressService = Depends(get_progress_service),
):
    """Get session history."""
    return await progress_service.get_sessions(user.id, limit, offset)


@router.get("/topics", response_model=TopicMasteryResponse)
async def get_topic_mastery(
    user: CurrentUser,
    progress_service: ProgressService = Depends(get_progress_service),
):
    """Get mastery level per topic/deck."""
    return await progress_service.get_topic_mastery(user.id)
