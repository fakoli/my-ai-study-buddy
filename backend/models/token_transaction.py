from datetime import datetime

from pydantic import BaseModel, Field


class TokenTransaction(BaseModel):
    """Record of a token balance change."""

    id: str
    user_id: str
    amount: int  # positive = credit, negative = debit
    balance_after: int
    operation: str  # "admin_adjustment", "generate_content", etc.
    reason: str | None = None
    admin_id: str | None = None
    created_at: datetime


class AdjustTokensRequest(BaseModel):
    """Request to adjust a user's token balance."""

    amount: int = Field(..., ge=-1000000, le=1000000, description="Positive to add, negative to deduct")
    reason: str = Field(..., min_length=1, max_length=500)


class AdjustTokensResponse(BaseModel):
    """Response after adjusting tokens."""

    user_id: str
    previous_balance: int
    new_balance: int
    amount: int
    transaction_id: str


class TokenTransactionResponse(BaseModel):
    """Token transaction for API responses."""

    id: str
    amount: int
    balance_after: int
    operation: str
    reason: str | None
    admin_id: str | None
    created_at: datetime
