"""Admin service for user management and token administration."""

from datetime import datetime, timezone
from uuid import uuid4

from exceptions import ErrorCode, NotFoundException
from models.token_transaction import (
    AdjustTokensResponse,
    TokenTransaction,
    TokenTransactionResponse,
)
from models.user import User, UserRole
from services.base_service import BaseService
from storage.base import StorageBackend
from utils.datetime_utils import ensure_datetime_required


class AdminService(BaseService):
    """Service for admin operations."""

    def __init__(self, storage: StorageBackend):
        super().__init__(storage)

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """List all users with optional search and pagination.

        Args:
            skip: Number of records to skip
            limit: Maximum records to return
            search: Optional search term for email or name

        Returns:
            Tuple of (users list, total count)

        Note:
            This MVP implementation loads all users into memory for filtering and pagination.
            For production use with large user bases (>10,000 users), consider implementing
            database-level filtering and pagination in the storage backend.
        """
        all_users = await self.storage.list("users", {})

        # Filter by search term if provided
        if search:
            search_lower = search.lower()
            all_users = [
                u
                for u in all_users
                if search_lower in u.get("email", "").lower()
                or search_lower in u.get("name", "").lower()
            ]

        total = len(all_users)

        # Apply pagination
        paginated = all_users[skip : skip + limit]

        users = [
            User(
                id=u["id"],
                email=u["email"],
                name=u["name"],
                created_at=ensure_datetime_required(u["created_at"]),
                token_balance=u.get("token_balance", 100),
                role=UserRole(u.get("role", "user")),
            )
            for u in paginated
        ]

        return users, total

    async def get_user_detail(self, user_id: str) -> tuple[User, list[TokenTransactionResponse]]:
        """Get user details with their token transaction history.

        Args:
            user_id: The user ID to fetch

        Returns:
            Tuple of (user, transactions list)
        """
        user_data = await self.storage.get("users", user_id)
        if not user_data:
            raise NotFoundException(
                "User not found",
                code=ErrorCode.USER_NOT_FOUND,
                details={"user_id": user_id},
            )

        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            created_at=ensure_datetime_required(user_data["created_at"]),
            token_balance=user_data.get("token_balance", 100),
            role=UserRole(user_data.get("role", "user")),
        )

        # Get token transactions
        all_transactions = await self.storage.list("token_transactions", {"user_id": user_id})
        transactions = [
            TokenTransactionResponse(
                id=t["id"],
                amount=t["amount"],
                balance_after=t["balance_after"],
                operation=t["operation"],
                reason=t.get("reason"),
                admin_id=t.get("admin_id"),
                created_at=ensure_datetime_required(t["created_at"]),
            )
            for t in sorted(all_transactions, key=lambda x: x["created_at"], reverse=True)
        ]

        return user, transactions

    async def adjust_tokens(
        self,
        user_id: str,
        amount: int,
        reason: str,
        admin_id: str,
    ) -> AdjustTokensResponse:
        """Adjust a user's token balance.

        Args:
            user_id: The user to adjust
            amount: Amount to add (positive) or deduct (negative)
            reason: Reason for the adjustment
            admin_id: ID of the admin making the adjustment

        Returns:
            AdjustTokensResponse with balance details
        """
        user_data = await self.storage.get("users", user_id)
        if not user_data:
            raise NotFoundException(
                "User not found",
                code=ErrorCode.USER_NOT_FOUND,
                details={"user_id": user_id},
            )

        previous_balance = user_data.get("token_balance", 100)
        new_balance = max(0, previous_balance + amount)  # Prevent negative balance
        actual_amount = new_balance - previous_balance  # Actual amount applied after clamping

        try:
            # Update user's token balance
            await self.storage.update("users", user_id, {"token_balance": new_balance})

            # Create transaction record with actual amount applied
            now = datetime.now(timezone.utc)
            transaction = TokenTransaction(
                id=str(uuid4()),
                user_id=user_id,
                amount=actual_amount,
                balance_after=new_balance,
                operation="admin_adjustment",
                reason=reason,
                admin_id=admin_id,
                created_at=now,
            )
            await self.storage.create("token_transactions", transaction.model_dump())
        except Exception as e:
            # Attempt to roll back the balance update if transaction logging fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Failed to create token transaction for user {user_id}. "
                f"Attempting rollback. Error: {e}"
            )
            try:
                await self.storage.update(
                    "users",
                    user_id,
                    {"token_balance": previous_balance},
                )
            except Exception as rollback_error:
                logger.error(f"Rollback failed for user {user_id}: {rollback_error}")
            finally:
                # Re-raise the original error to signal failure to the caller
                raise

        return AdjustTokensResponse(
            user_id=user_id,
            previous_balance=previous_balance,
            new_balance=new_balance,
            amount=actual_amount,
            transaction_id=transaction.id,
        )

    async def get_stats(self) -> dict:
        """Get basic admin statistics.

        Returns:
            Dict with stats like total users, etc.

        Note:
            This MVP implementation loads all users into memory for computation.
            For production use with large user bases (>10,000 users), consider implementing
            database-level aggregations in the storage backend.
        """
        all_users = await self.storage.list("users", {})
        total_users = len(all_users)

        # Count admins vs regular users
        admin_count = sum(1 for u in all_users if u.get("role") == "admin")
        user_count = total_users - admin_count

        # Total tokens in circulation
        total_tokens = sum(u.get("token_balance", 100) for u in all_users)

        return {
            "total_users": total_users,
            "admin_count": admin_count,
            "user_count": user_count,
            "total_tokens": total_tokens,
        }
