"""Admin API routes for user management and token administration."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from logging_config import get_logger

logger = get_logger(__name__)

from dependencies import AdminUser, StorageDep
from models.token_transaction import (
    AdjustTokensRequest,
    AdjustTokensResponse,
    TokenTransactionResponse,
)
from models.user import User
from services.admin_service import AdminService

router = APIRouter()


def get_admin_service(storage: StorageDep) -> AdminService:
    return AdminService(storage)


class UserListResponse(BaseModel):
    """Response for user list endpoint."""

    users: list[User]
    total: int
    skip: int
    limit: int


class UserDetailResponse(BaseModel):
    """Response for user detail endpoint."""

    user: User
    transactions: list[TokenTransactionResponse]


class AdminStatsResponse(BaseModel):
    """Response for admin stats endpoint."""

    total_users: int
    admin_count: int
    user_count: int
    total_tokens: int


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: AdminUser,
    admin_service: AdminService = Depends(get_admin_service),
) -> AdminStatsResponse:
    """Get admin dashboard statistics."""
    stats = await admin_service.get_stats()
    return AdminStatsResponse(**stats)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    admin: AdminUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, min_length=1),
    admin_service: AdminService = Depends(get_admin_service),
) -> UserListResponse:
    """List all users with search and pagination."""
    users, total = await admin_service.list_users(skip=skip, limit=limit, search=search)
    return UserListResponse(users=users, total=total, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    admin: AdminUser,
    admin_service: AdminService = Depends(get_admin_service),
) -> UserDetailResponse:
    """Get user details with transaction history."""
    user, transactions = await admin_service.get_user_detail(user_id)
    return UserDetailResponse(user=user, transactions=transactions)


@router.put("/users/{user_id}/tokens", response_model=AdjustTokensResponse)
async def adjust_user_tokens(
    user_id: str,
    request: AdjustTokensRequest,
    admin: AdminUser,
    admin_service: AdminService = Depends(get_admin_service),
) -> AdjustTokensResponse:
    """Adjust a user's token balance.

    The service deliberately re-raises raw exceptions after a rollback
    (see services/admin_service.py:184). Translate those into a
    StudyBuddyException so the structured 500 error contract is preserved
    (see .tickets/003) instead of a raw exception escaping the route.
    """
    from exceptions import ErrorCode, StudyBuddyException

    try:
        return await admin_service.adjust_tokens(
            user_id=user_id,
            amount=request.amount,
            reason=request.reason,
            admin_id=admin.id,
        )
    except StudyBuddyException:
        raise
    except Exception as e:
        # Never embed the raw exception message in the response — it can
        # leak server paths / internals (see the "never leak" contract in
        # main.py's generic handler). Log it server-side only.
        logger.error(
            "Token adjustment failed",
            user_id=user_id,
            error=type(e).__name__,
            error_message=str(e),
        )
        raise StudyBuddyException(
            "Token adjustment failed",
            status_code=500,
            code=ErrorCode.INTERNAL_ERROR,
        ) from e
