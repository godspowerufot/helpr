"""Provider businesses (ADR 0005): onboarding, profile, listings and earnings. Every query is
filtered by the provider's workspace id, resolved by MSFLib from the URL slug."""

import re

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.actions import tenant_action, user_action, workspace_action
from app.api.deps import ProviderContext
from app.core.config import settings
from app.models import (
    Account,
    Booking,
    BookingStatus,
    Category,
    Listing,
    ListingStatus,
    ProviderProfile,
    User,
    UserType,
    Workspace,
    WorkspaceCreate,
)
from app.schemas.listing import ListingUpdate, ListingWrite, ProviderListing
from app.schemas.provider import (
    Earnings,
    EarningsEntry,
    ProviderMine,
    ProviderStats,
    ProviderUpdate,
    ProviderWrite,
)
from app.services import geo, provider_photo
from app.services.booking import _customer_name, open_booking_count
from app.services.marketplace import listing_card, provider_public

# Workspace slugs share the URL root with fixed API paths.
RESERVED_SLUGS = {
    "default",
    "current",
    "admin",
    "bookings",
    "categories",
    "health",
    "listings",
    "login",
    "logout",
    "map",
    "me",
    "notifications",
    "open",
    "payments",
    "profiles",
    "provider",
    "providers",
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:60].strip("-")


def provider_mine(session: Session, profile: ProviderProfile, workspace: Workspace) -> ProviderMine:
    published = session.exec(
        select(func.count())
        .select_from(Listing)
        .where(
            Listing.provider_workspace_id == workspace.id,
            Listing.status == ListingStatus.published,
        )
    ).one()
    completed = session.exec(
        select(func.count())
        .select_from(Booking)
        .where(
            Booking.provider_workspace_id == workspace.id,
            Booking.status == BookingStatus.completed,
        )
    ).one()
    photo = provider_photo.profile_photo(session, workspace.id)
    return ProviderMine(
        **provider_public(profile, workspace).model_dump(),
        id=profile.id,
        workspace_slug=workspace.slug,
        bio=profile.bio,
        phone=profile.phone,
        photo_url=photo.url if photo else None,
        photos=[
            provider_photo.photo_public(p)
            for p in provider_photo.work_photos(session, workspace.id)
        ],
        stats=ProviderStats(
            published_listing_count=published,
            open_booking_count=open_booking_count(session, workspace.id),
            completed_booking_count=completed,
        ),
    )


def _checked_point(lat: float | None, lng: float | None) -> tuple[float | None, float | None]:
    point = geo.require_point(lat, lng)
    return point if point else (None, None)


def create_provider(session: Session, account: Account, data: ProviderWrite) -> ProviderMine:
    """`POST /providers`: a new workspace owned by the caller plus its `ProviderProfile`."""
    slug = slugify(data.display_name)
    if len(slug) < 2 or slug in RESERVED_SLUGS:
        raise HTTPException(status_code=422, detail="Choose a different business name.")
    if workspace_action.get_by_all(session, slug=slug) is not None:
        raise HTTPException(status_code=409, detail="That business name is already taken.")
    latitude, longitude = _checked_point(data.latitude, data.longitude)

    tenant = tenant_action.ensure_default_tenant(session, settings=settings.scope("TENANCY"))
    workspace = workspace_action.create_with_owner(
        session,
        data=WorkspaceCreate(
            name=data.display_name,
            slug=slug,
            description=data.bio,
            owner_id=account.id,
            status="open",
        ),
        owner=account,
        tenant=tenant,
        commit=False,
    )
    session.flush()
    user_action.create_membership(
        session,
        account_id=account.id,
        workspace_id=workspace.id,
        owner_id=account.id,
        commit=False,
    )
    profile = ProviderProfile(
        workspace_id=workspace.id,
        display_name=data.display_name.strip(),
        bio=data.bio.strip(),
        service_area=data.service_area.strip(),
        phone=data.phone.strip(),
        latitude=latitude,
        longitude=longitude,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    session.refresh(workspace)
    return provider_mine(session, profile, workspace)


def my_providers(session: Session, account: Account) -> list[ProviderMine]:
    rows = session.exec(
        select(ProviderProfile, Workspace)
        .join(Workspace, Workspace.id == ProviderProfile.workspace_id)
        .join(User, User.workspace_id == Workspace.id)
        .where(
            User.account_id == account.id,
            col(User.type).in_([UserType.owner, UserType.admin]),
        )
        .order_by(col(Workspace.name))
    ).all()
    return [provider_mine(session, profile, workspace) for profile, workspace in rows]


def update_provider(session: Session, ctx: ProviderContext, data: ProviderUpdate) -> ProviderMine:
    changes = data.model_dump(exclude_unset=True)
    if "latitude" in changes or "longitude" in changes:
        changes["latitude"], changes["longitude"] = _checked_point(
            changes.get("latitude", ctx.profile.latitude),
            changes.get("longitude", ctx.profile.longitude),
        )
    for field, value in changes.items():
        setattr(ctx.profile, field, value.strip() if isinstance(value, str) else value)
    session.add(ctx.profile)
    session.commit()
    session.refresh(ctx.profile)
    return provider_mine(session, ctx.profile, ctx.workspace)


# --- listings ----------------------------------------------------------------------------


def _category(session: Session, slug: str) -> Category:
    category = session.exec(select(Category).where(Category.slug == slug)).first()
    if category is None:
        raise HTTPException(status_code=422, detail="Unknown category.")
    return category


def _provider_listing(session: Session, listing: Listing, ctx: ProviderContext) -> ProviderListing:
    category = session.get(Category, listing.category_id)
    card = listing_card(listing, category, ctx.profile, ctx.workspace)
    return ProviderListing(
        **card.model_dump(),
        status=listing.status,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
    )


def _own_listing(session: Session, listing_id: int, ctx: ProviderContext) -> Listing:
    listing = session.get(Listing, listing_id)
    if listing is None or listing.provider_workspace_id != ctx.workspace.id:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return listing


def list_provider_listings(session: Session, ctx: ProviderContext) -> list[ProviderListing]:
    listings = session.exec(
        select(Listing)
        .where(Listing.provider_workspace_id == ctx.workspace.id)
        .order_by(col(Listing.created_at).desc(), col(Listing.id).desc())
    ).all()
    return [_provider_listing(session, listing, ctx) for listing in listings]


def create_listing(session: Session, ctx: ProviderContext, data: ListingWrite) -> ProviderListing:
    listing = Listing(
        provider_workspace_id=ctx.workspace.id,
        category_id=_category(session, data.category_slug).id,
        status=ListingStatus.draft,
        **data.model_dump(exclude={"category_slug"}),
    )
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return _provider_listing(session, listing, ctx)


def update_listing(
    session: Session, listing_id: int, ctx: ProviderContext, data: ListingUpdate
) -> ProviderListing:
    listing = _own_listing(session, listing_id, ctx)
    changes = data.model_dump(exclude_unset=True)
    if "category_slug" in changes:
        listing.category_id = _category(session, changes.pop("category_slug")).id
    for field, value in changes.items():
        setattr(listing, field, value)
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return _provider_listing(session, listing, ctx)


def set_listing_status(
    session: Session, listing_id: int, ctx: ProviderContext, target: ListingStatus
) -> ProviderListing:
    listing = _own_listing(session, listing_id, ctx)
    if listing.status == target:
        raise HTTPException(status_code=409, detail=f"Listing is already {target}.")
    listing.status = target
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return _provider_listing(session, listing, ctx)


# --- earnings ----------------------------------------------------------------------------


def earnings(session: Session, ctx: ProviderContext) -> Earnings:
    """`total_amount`: completed bookings; `pending_amount`: paid, not yet completed. Only
    bookings whose Paystack payment is verified count (PROPOSAL §8)."""
    from app.models import Payment, PaymentStatus

    rows = session.exec(
        select(Booking, Listing)
        .join(Listing, Listing.id == Booking.listing_id)
        .join(Payment, Payment.id == Booking.payment_id)
        .where(
            Booking.provider_workspace_id == ctx.workspace.id,
            col(Booking.status).in_([BookingStatus.paid, BookingStatus.completed]),
            col(Payment.status).in_([PaymentStatus.verified, PaymentStatus.fulfilled]),
        )
        .order_by(col(Booking.updated_at).desc(), col(Booking.id).desc())
    ).all()
    entries = [
        EarningsEntry(
            booking_id=booking.id,
            listing_title=listing.title,
            customer_name=_customer_name(session, booking.customer_account_id),
            amount=booking.price_amount,
            currency=booking.currency,
            status=booking.status,
            updated_at=booking.updated_at,
        )
        for booking, listing in rows
    ]
    completed = [e for e in entries if e.status == BookingStatus.completed]
    return Earnings(
        completed_count=len(completed),
        total_amount=sum(e.amount for e in completed),
        pending_amount=sum(e.amount for e in entries if e.status == BookingStatus.paid),
        currency="NGN",
        recent=entries[:10],
    )
