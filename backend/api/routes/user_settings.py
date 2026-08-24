"""User settings routes for Anvil AI connectivity.

The platform uses a single self-hosted Anvil Serving router (OpenAI-compatible)
for all text generation, so there are no per-user provider API keys to manage.
This router exposes the remaining user-facing settings surface: an
"Anvil connection" check that verifies the server-side router configuration.
"""

from fastapi import APIRouter, Depends

from config import get_settings
from dependencies import get_current_user
from models.user import User
from services.anvil_client import check_anvil_health

router = APIRouter()


@router.get("/ai-connection")
async def check_ai_connection(
    user: User = Depends(get_current_user),
) -> dict:
    """Check that the server's Anvil router is configured and reachable.

    Returns the router status so users can verify AI features will work.
    No secrets are exposed.
    """
    settings = get_settings()
    is_valid, message = await check_anvil_health(settings)
    return {
        "provider": "anvil",
        "is_configured": bool(settings.anvil_router_base_url and settings.anvil_router_token),
        "is_reachable": is_valid,
        "model": settings.anvil_model,
        "message": message,
    }
