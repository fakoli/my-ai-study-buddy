from fastapi import APIRouter, Depends

from config import Settings, get_settings
from dependencies import CurrentUser, StorageDep
from models.user import (
    ConsumeTokensRequest,
    TokenBalanceResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from services.auth_service import AuthService

router = APIRouter()


def get_auth_service(storage: StorageDep, settings: Settings = Depends(get_settings)) -> AuthService:
    return AuthService(storage, settings)


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user."""
    return await auth_service.register(user_data)


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate and get access token."""
    token = await auth_service.login(credentials.email, credentials.password)
    return TokenResponse(access_token=token)


@router.post("/logout")
async def logout(user: CurrentUser):
    """Logout current user (invalidate session)."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(user: CurrentUser):
    """Get current user profile."""
    return user


@router.get("/tokens", response_model=TokenBalanceResponse)
async def get_token_balance(
    user: CurrentUser,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get current token balance."""
    balance = await auth_service.get_token_balance(user.id)
    return TokenBalanceResponse(balance=balance)


@router.post("/tokens/consume", response_model=TokenBalanceResponse)
async def consume_tokens(
    request: ConsumeTokensRequest,
    user: CurrentUser,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Consume tokens for an operation."""
    new_balance = await auth_service.consume_tokens(user.id, request.amount)
    return TokenBalanceResponse(balance=new_balance)
