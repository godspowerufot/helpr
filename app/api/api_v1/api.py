from fastapi import APIRouter
from msflib.account.router import account_router, profile_router
from msflib.auth.router import router as auth_router
from msflib.notifications.router import account_notification_router
from msflib.payments.router import router as payments_router

from app import models
from app.api import deps
from app.api.api_v1.endpoints import (
    admin,
    bookings,
    categories,
    health,
    listings,
    map,
    provider_area,
    providers,
)
from app.core.config import settings

api_router = APIRouter()

api_router.include_router(
    auth_router(
        get_session=deps.get_session,
        get_keystore=deps.get_keystore,
        get_current_account=deps.get_current_account,
        account_type=models.Account,
        account_read_type=models.AccountRead,
        settings=settings,
        active_statuses=[models.AccountStatus.active, models.AccountStatus.online],
        prefix="",
        tags=["auth"],
    )
)

api_router.include_router(
    account_router(
        get_session=deps.get_session,
        get_current_account=deps.get_current_account,
        settings=settings,
        account_type=models.Account,
        profile_type=models.Profile,
        account_read_type=models.AccountRead,
        prefix="",
        tags=["accounts"],
    )
)

api_router.include_router(
    profile_router(
        get_session=deps.get_session,
        get_current_account=deps.get_current_account,
        get_current_active_account=deps.get_current_active_account,
        settings=settings,
        profile_type=models.Profile,
        account_type=models.Account,
        profile_read_type=models.ProfileRead,
        prefix="/profiles",
        tags=["profiles"],
    )
)

api_router.include_router(
    payments_router(
        get_session=deps.get_session,
        get_current_account=deps.get_current_account,
        settings=settings,
        prefix="/payments",
        tags=["payments"],
    )
)

api_router.include_router(
    account_notification_router(
        get_session=deps.get_session,
        get_current_account=deps.get_current_account,
        prefix="/notifications",
        tags=["notifications"],
    )
)

api_router.include_router(admin.router, prefix="/admin")

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(categories.router, prefix="/categories", tags=["marketplace"])
api_router.include_router(listings.router, prefix="/listings", tags=["marketplace"])
api_router.include_router(providers.router, prefix="/providers", tags=["marketplace"])
api_router.include_router(map.router, prefix="/map", tags=["map"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
# Last: its `/{workspace_slug}` prefix would otherwise shadow fixed paths.
api_router.include_router(
    provider_area.router, prefix="/{workspace_slug}/provider", tags=["provider"]
)
