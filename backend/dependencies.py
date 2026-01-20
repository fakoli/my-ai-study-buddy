from typing import Annotated

from fastapi import Depends, Header
from jose import JWTError

from config import Settings, get_settings
from exceptions import ForbiddenException, UnauthorizedException
from models.user import User, UserRole
from storage import get_storage_backend
from storage.base import StorageBackend


def get_storage(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageBackend:
    return get_storage_backend(settings)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    storage: Annotated[StorageBackend, Depends(get_storage)] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
) -> User:
    """Extract and validate user from JWT token."""
    if not authorization:
        raise UnauthorizedException("Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format")

    token = authorization[7:]

    from services.auth_service import AuthService

    auth_service = AuthService(storage, settings)
    return await auth_service.get_user_from_token(token)


async def get_optional_user(
    authorization: Annotated[str | None, Header()] = None,
    storage: Annotated[StorageBackend, Depends(get_storage)] = None,
    settings: Annotated[Settings, Depends(get_settings)] = None,
) -> User | None:
    """Extract user from JWT token if present, otherwise return None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization[7:]

    try:
        from services.auth_service import AuthService

        auth_service = AuthService(storage, settings)
        return await auth_service.get_user_from_token(token)
    except (UnauthorizedException, JWTError):
        # Expected auth failures - return None for optional user
        return None
    # Let other exceptions (DB errors, etc.) propagate


# Type aliases for cleaner dependency injection
StorageDep = Annotated[StorageBackend, Depends(get_storage)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Verify the current user has admin privileges."""
    if user.role != UserRole.ADMIN:
        raise ForbiddenException("Admin access required")
    return user


# Admin type alias
AdminUser = Annotated[User, Depends(require_admin)]
