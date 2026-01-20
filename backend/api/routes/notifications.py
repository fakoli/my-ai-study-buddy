from fastapi import APIRouter, Depends, Query

from config import Settings, get_settings
from dependencies import CurrentUser, StorageDep
from models.notification import (
    NotificationHistoryResponse,
    NotificationPreferences,
    NotificationPreferencesUpdate,
    TestNotificationResponse,
)
from services.notification_service import NotificationService
from services.notifications.email_service import EmailService
from services.notifications.sms_service import SMSService

router = APIRouter()


def get_notification_service(
    storage: StorageDep, settings: Settings = Depends(get_settings)
) -> NotificationService:
    email_service = EmailService(settings)
    sms_service = SMSService(settings)
    return NotificationService(storage, email_service, sms_service)


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(
    user: CurrentUser,
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Get notification preferences."""
    return await notification_service.get_preferences(user.id, user.email)


@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(
    updates: NotificationPreferencesUpdate,
    user: CurrentUser,
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Update notification preferences."""
    return await notification_service.update_preferences(user.id, updates)


@router.get("/history", response_model=NotificationHistoryResponse)
async def get_history(
    user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Get notification history."""
    return await notification_service.get_history(user.id, limit, offset)


@router.post("/test/email", response_model=TestNotificationResponse)
async def test_email(
    user: CurrentUser,
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Send a test email notification."""
    success, message = await notification_service.test_email(user.id)
    return TestNotificationResponse(success=success, message=message)


@router.post("/test/sms", response_model=TestNotificationResponse)
async def test_sms(
    user: CurrentUser,
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Send a test SMS notification."""
    success, message = await notification_service.test_sms(user.id)
    return TestNotificationResponse(success=success, message=message)
