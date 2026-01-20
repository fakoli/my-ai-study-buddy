from fastapi import APIRouter, Depends, Query

from dependencies import CurrentUser, StorageDep
from models.review import DueCardsResponse, Review, ReviewCreate, ReviewHistoryResponse
from services.review_service import ReviewService

router = APIRouter()


def get_review_service(storage: StorageDep) -> ReviewService:
    return ReviewService(storage)


@router.post("", response_model=Review)
async def submit_review(
    review_data: ReviewCreate,
    user: CurrentUser,
    review_service: ReviewService = Depends(get_review_service),
):
    """Submit a card review with difficulty rating."""
    return await review_service.submit_review(user.id, review_data)


@router.get("/due", response_model=DueCardsResponse)
async def get_due_cards(
    user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    review_service: ReviewService = Depends(get_review_service),
):
    """Get cards due for review."""
    return await review_service.get_due_cards(user.id, limit)


@router.get("/history", response_model=ReviewHistoryResponse)
async def get_review_history(
    user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    review_service: ReviewService = Depends(get_review_service),
):
    """Get review history."""
    return await review_service.get_review_history(user.id, limit, offset)
