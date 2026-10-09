"""Public marketplace reads (ADR 0009): published listings only, public schemas only."""

from sqlalchemy import func, or_
from sqlmodel import Session, col, select

from app.models import (
    Account,
    Category,
    Listing,
    ListingStatus,
    Profile,
    ProviderProfile,
    Review,
    Workspace,
)
from app.schemas.category import CategoryPublic, CategoryRef
from app.schemas.listing import (
    ListingCard,
    ListingDetail,
    ListingList,
    ListingSort,
    ProviderDetail,
)
from app.schemas.provider import PinListing, ProviderPin, ProviderPublic, ProviderRef
from app.schemas.review import ReviewList, ReviewPublic
from app.services import provider_photo
from app.services.geo import bounding_box, haversine_km

RECENT_REVIEWS = 5


def _public_listings():
    return (
        select(Listing, Category, ProviderProfile, Workspace)
        .join(Category, Category.id == Listing.category_id)
        .join(ProviderProfile, ProviderProfile.workspace_id == Listing.provider_workspace_id)
        .join(Workspace, Workspace.id == Listing.provider_workspace_id)
        .where(Listing.status == ListingStatus.published)
    )


def _within_box(stmt, lat: float, lng: float, radius_km: float):
    south, west, north, east = bounding_box(lat, lng, radius_km)
    return stmt.where(
        col(ProviderProfile.latitude).between(south, north),
        col(ProviderProfile.longitude).between(west, east),
    )


def _distance(provider: ProviderProfile, point: tuple[float, float] | None) -> float | None:
    if point is None or provider.latitude is None or provider.longitude is None:
        return None
    return round(haversine_km(point[0], point[1], provider.latitude, provider.longitude), 2)


def provider_public(provider: ProviderProfile, workspace: Workspace) -> ProviderPublic:
    return ProviderPublic(
        slug=workspace.slug,
        display_name=provider.display_name,
        service_area=provider.service_area,
        rating_avg=provider.rating_avg,
        rating_count=provider.rating_count,
        latitude=provider.latitude,
        longitude=provider.longitude,
    )


def listing_card(
    listing: Listing,
    category: Category,
    provider: ProviderProfile,
    workspace: Workspace,
    distance_km: float | None = None,
) -> ListingCard:
    return ListingCard(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        pricing_type=listing.pricing_type,
        price_amount=listing.price_amount,
        currency=listing.currency,
        duration_minutes=listing.duration_minutes,
        service_area=listing.service_area,
        rating_avg=listing.rating_avg,
        rating_count=listing.rating_count,
        category=CategoryRef(slug=category.slug, name=category.name),
        provider=ProviderRef(slug=workspace.slug, display_name=provider.display_name),
        latitude=provider.latitude,
        longitude=provider.longitude,
        distance_km=distance_km,
    )


def customer_display_name(account: Account, profile: Profile | None) -> str:
    if profile and profile.first_name:
        initial = f" {profile.last_name[0]}." if profile.last_name else ""
        return f"{profile.first_name}{initial}"
    return account.username or "Helpr customer"


def review_public(review: Review, account: Account, profile: Profile | None) -> ReviewPublic:
    return ReviewPublic(
        id=review.id,
        booking_id=review.booking_id,
        listing_id=review.listing_id,
        rating=review.rating,
        comment=review.comment,
        customer_name=customer_display_name(account, profile),
        created_at=review.created_at,
    )


def _reviews(session: Session, *filters, limit: int, offset: int) -> ReviewList:
    base = (
        select(Review, Account, Profile)
        .join(Account, Account.id == Review.customer_account_id)
        .outerjoin(Profile, Profile.id == Account.id)
        .where(*filters)
    )
    total = session.exec(select(func.count()).select_from(base.subquery())).one()
    rows = session.exec(
        base.order_by(col(Review.created_at).desc(), col(Review.id).desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return ReviewList(items=[review_public(*row) for row in rows], total=total)


def list_categories(session: Session) -> list[CategoryPublic]:
    categories = session.exec(select(Category).order_by(Category.name)).all()
    return [CategoryPublic(id=c.id, slug=c.slug, name=c.name) for c in categories]


def list_listings(
    session: Session,
    *,
    category: str | None,
    q: str | None,
    area: str | None,
    sort: ListingSort | None,
    limit: int,
    offset: int,
    point: tuple[float, float] | None = None,
    radius_km: float | None = None,
) -> ListingList:
    stmt = _public_listings()
    if category:
        stmt = stmt.where(Category.slug == category)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(col(Listing.title).ilike(pattern), col(Listing.description).ilike(pattern))
        )
    if area:
        stmt = stmt.where(col(Listing.service_area).ilike(f"%{area.strip()}%"))

    order_by = {
        "price_asc": [col(Listing.price_amount).asc()],
        "price_desc": [col(Listing.price_amount).desc()],
        "rating": [col(Listing.rating_avg).desc(), col(Listing.rating_count).desc()],
    }.get(sort or "", [col(Listing.created_at).desc()])
    stmt = stmt.order_by(*order_by, col(Listing.id).desc())

    if point is None:
        total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
        rows = session.exec(stmt.offset(offset).limit(limit)).all()
        return ListingList(items=[listing_card(*row) for row in rows], total=total)

    # Nearby: box in SQL, exact radius in Python, then page (ADR 0022).
    cards = []
    for listing, cat, provider, workspace in session.exec(
        _within_box(stmt, *point, radius_km)
    ).all():
        distance = _distance(provider, point)
        if distance is not None and distance <= radius_km:
            cards.append(listing_card(listing, cat, provider, workspace, distance))
    if sort in (None, "distance"):
        cards.sort(key=lambda c: (c.distance_km, -c.id))
    return ListingList(items=cards[offset : offset + limit], total=len(cards))


def get_listing(
    session: Session, listing_id: int, point: tuple[float, float] | None = None
) -> ListingDetail | None:
    row = session.exec(_public_listings().where(Listing.id == listing_id)).first()
    if row is None:
        return None
    listing, category, provider, workspace = row
    card = listing_card(listing, category, provider, workspace, _distance(provider, point))
    return ListingDetail(
        **card.model_dump(exclude={"provider"}),
        provider=provider_public(provider, workspace),
    )


def list_listing_reviews(
    session: Session, listing_id: int, *, limit: int, offset: int
) -> ReviewList | None:
    if session.exec(_public_listings().where(Listing.id == listing_id)).first() is None:
        return None
    return _reviews(session, Review.listing_id == listing_id, limit=limit, offset=offset)


def provider_workspace_id(session: Session, slug: str) -> int | None:
    return session.exec(
        select(Workspace.id)
        .join(ProviderProfile, ProviderProfile.workspace_id == Workspace.id)
        .where(Workspace.slug == slug)
    ).first()


def get_provider(session: Session, slug: str) -> ProviderDetail | None:
    row = session.exec(
        select(ProviderProfile, Workspace)
        .join(Workspace, Workspace.id == ProviderProfile.workspace_id)
        .where(Workspace.slug == slug)
    ).first()
    if row is None:
        return None
    provider, workspace = row
    listings = session.exec(
        _public_listings()
        .where(Listing.provider_workspace_id == workspace.id)
        .order_by(col(Listing.created_at).desc(), col(Listing.id).desc())
    ).all()
    reviews = _reviews(
        session,
        Review.provider_workspace_id == workspace.id,
        limit=RECENT_REVIEWS,
        offset=0,
    )
    profile_photo = provider_photo.profile_photo(session, workspace.id)
    return ProviderDetail(
        **provider_public(provider, workspace).model_dump(),
        bio=provider.bio,
        photo_url=profile_photo.url if profile_photo else None,
        photos=[
            provider_photo.photo_public(p)
            for p in provider_photo.work_photos(session, workspace.id)
        ],
        listings=[listing_card(*r) for r in listings],
        recent_reviews=reviews.items,
    )


def nearby_providers(
    session: Session,
    *,
    point: tuple[float, float],
    radius_km: float,
    category: str | None,
) -> list[ProviderPin]:
    """Providers with at least one published listing (in `category`, if given), nearest first."""
    stmt = _within_box(_public_listings(), *point, radius_km)
    if category:
        stmt = stmt.where(Category.slug == category)

    pins: dict[int, ProviderPin] = {}
    for listing, cat, provider, workspace in session.exec(
        stmt.order_by(col(Listing.price_amount), col(Listing.id))
    ).all():
        distance = _distance(provider, point)
        if distance is None or distance > radius_km:
            continue
        pin = pins.get(workspace.id)
        if pin is None:
            pin = pins[workspace.id] = ProviderPin(
                **provider_public(provider, workspace).model_dump(),
                distance_km=distance,
                listing_count=0,
                categories=[],
                listings=[],
            )
        pin.listing_count += 1
        pin.listings.append(
            PinListing(
                id=listing.id,
                title=listing.title,
                pricing_type=listing.pricing_type,
                price_amount=listing.price_amount,
                currency=listing.currency,
            )
        )
        if cat.name not in pin.categories:
            pin.categories.append(cat.name)
    return sorted(pins.values(), key=lambda p: (p.distance_km, p.slug))
