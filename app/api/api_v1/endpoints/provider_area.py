"""Provider area, mounted at `/{workspace_slug}/provider` (ADR 0005). Every route depends on
`deps.get_provider_context`: MSFLib resolves the workspace from the slug and checks an active
owner/admin membership; we check the workspace is a provider."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Body, Depends, File, Form, UploadFile
from sqlmodel import Session

from app.api import deps
from app.api.deps import ProviderContext
from app.models import Booking, BookingStatus, ListingStatus
from app.schemas.booking import BookingDetail, BookingReason, BookingSummary
from app.schemas.listing import ListingUpdate, ListingWrite, ProviderListing
from app.schemas.provider import (
    BlockedDayPublic,
    BlockedDayWrite,
    Earnings,
    ProviderMine,
    ProviderPhotoPublic,
    ProviderUpdate,
)
from app.services import availability
from app.services import booking as booking_service
from app.services import provider as service
from app.services import provider_photo as photo_service

router = APIRouter()


@router.get("", response_model=ProviderMine)
def read_provider(
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderMine:
    """Provider owner/admin. Profile with listing and booking counts."""
    return service.provider_mine(session, ctx.profile, ctx.workspace)


@router.patch("", response_model=ProviderMine)
def update_provider(
    data: ProviderUpdate,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderMine:
    """Provider owner/admin. Edit the profile, including the map location."""
    return service.update_provider(session, ctx, data)


@router.post("/photo", response_model=ProviderMine)
def upload_profile_photo(
    file: UploadFile = File(...),
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderMine:
    """Provider owner/admin. Set or replace the business photo (ADR 0027): JPEG, PNG or WebP up
    to 5 MB (413 too big, 415 wrong type)."""
    photo_service.set_profile_photo(session, ctx, file)
    return service.provider_mine(session, ctx.profile, ctx.workspace)


@router.delete("/photo", response_model=ProviderMine)
def delete_profile_photo(
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderMine:
    """Provider owner/admin. 404 if there is no business photo."""
    photo_service.remove_profile_photo(session, ctx)
    return service.provider_mine(session, ctx.profile, ctx.workspace)


@router.post("/photos", response_model=ProviderPhotoPublic, status_code=201)
def upload_work_photo(
    file: UploadFile = File(...),
    caption: str = Form(default="", max_length=140),
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderPhotoPublic:
    """Provider owner/admin. Add a work photo (ADR 0027); 409 beyond 8 photos."""
    return photo_service.add_work_photo(session, ctx, file, caption)


@router.delete("/photos/{photo_id}", response_model=ProviderMine)
def delete_work_photo(
    photo_id: int,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderMine:
    """Provider owner/admin. 404 for another business's photo."""
    photo_service.remove_work_photo(session, ctx, photo_id)
    return service.provider_mine(session, ctx.profile, ctx.workspace)


@router.get("/blocked-days", response_model=list[BlockedDayPublic])
def read_blocked_days(
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> list[BlockedDayPublic]:
    """Provider owner/admin. Blocked days from today (Africa/Lagos), soonest first (ADR 0028)."""
    return availability.list_blocked_days(session, ctx)


@router.post("/blocked-days", response_model=BlockedDayPublic, status_code=201)
def create_blocked_day(
    data: BlockedDayWrite,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> BlockedDayPublic:
    """Provider owner/admin. 422 for a past day, 409 if already blocked. Existing bookings on
    that day are not changed."""
    return availability.block_day(session, ctx, data)


@router.delete("/blocked-days/{day}", response_model=list[BlockedDayPublic])
def delete_blocked_day(
    day: date,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> list[BlockedDayPublic]:
    """Provider owner/admin. Returns the remaining blocked days; 404 if the day is not
    blocked."""
    availability.unblock_day(session, ctx, day)
    return availability.list_blocked_days(session, ctx)


@router.get("/listings", response_model=list[ProviderListing])
def read_listings(
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> list[ProviderListing]:
    """Provider owner/admin. Listings in every status."""
    return service.list_provider_listings(session, ctx)


@router.post("/listings", response_model=ProviderListing, status_code=201)
def create_listing(
    data: ListingWrite,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderListing:
    """Provider owner/admin. New listings start as `draft`."""
    return service.create_listing(session, ctx, data)


@router.patch("/listings/{listing_id}", response_model=ProviderListing)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderListing:
    """Provider owner/admin. 404 for another provider's listing."""
    return service.update_listing(session, listing_id, ctx, data)


@router.post("/listings/{listing_id}/{action}", response_model=ProviderListing)
def change_listing_status(
    listing_id: int,
    action: Literal["publish", "archive"],
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> ProviderListing:
    """Provider owner/admin. 409 if the listing already has that status."""
    target = ListingStatus.published if action == "publish" else ListingStatus.archived
    return service.set_listing_status(session, listing_id, ctx, target)


@router.get("/bookings", response_model=list[BookingSummary])
def read_bookings(
    status: BookingStatus | None = None,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> list[BookingSummary]:
    """Provider owner/admin. Incoming bookings, newest first."""
    filters = [Booking.provider_workspace_id == ctx.workspace.id]
    if status:
        filters.append(Booking.status == status)
    return booking_service.list_bookings(session, *filters)


@router.get("/bookings/{booking_id}", response_model=BookingDetail)
def read_booking(
    booking_id: int,
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> BookingDetail:
    """Provider owner/admin. Detail with timeline and the job site's distance."""
    booking = booking_service.get_provider_booking(session, booking_id, ctx.workspace.id)
    return booking_service.booking_detail(session, booking)


@router.post("/bookings/{booking_id}/{action}", response_model=BookingDetail)
def act_on_booking(
    booking_id: int,
    action: Literal["accept", "decline", "cancel", "complete"],
    data: BookingReason = Body(default_factory=BookingReason),
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> BookingDetail:
    """Provider owner/admin. ADR 0007: accept/decline a `requested` booking, cancel an
    `accepted` one (reason required), complete a `paid` one; otherwise 409."""
    booking = booking_service.provider_act(
        session,
        booking_id,
        action,
        workspace_id=ctx.workspace.id,
        provider=ctx.profile,
        account=ctx.account,
        reason=data.reason,
    )
    return booking_service.booking_detail(session, booking)


@router.get("/earnings", response_model=Earnings)
def read_earnings(
    ctx: ProviderContext = Depends(deps.get_provider_context),
    session: Session = Depends(deps.get_session),
) -> Earnings:
    """Provider owner/admin. Verified Paystack payments: completed total and paid pending."""
    return service.earnings(session, ctx)
