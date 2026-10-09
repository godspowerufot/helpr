from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.api import deps
from app.models import Account
from app.schemas.listing import ProviderDetail
from app.schemas.provider import ProviderMine, ProviderPin, ProviderWrite
from app.services import availability, geo, marketplace
from app.services import provider as provider_service

router = APIRouter()


@router.post("", response_model=ProviderMine, status_code=201)
def become_provider(
    data: ProviderWrite,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> ProviderMine:
    """Customer. Create a provider business: an MSFLib workspace owned by the caller plus its
    `ProviderProfile` (ADR 0005). 409 if the name's slug is taken."""
    return provider_service.create_provider(session, account, data)


@router.get("/mine", response_model=list[ProviderMine])
def read_my_providers(
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> list[ProviderMine]:
    """Customer. Provider businesses I own or administer."""
    return provider_service.my_providers(session, account)


@router.get("/nearby", response_model=list[ProviderPin])
def read_nearby_providers(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0),
    category: str | None = Query(default=None, max_length=64),
    session: Session = Depends(deps.get_session),
) -> list[ProviderPin]:
    """Public. Providers with published listings within `radius_km` (capped) of a point in the
    service region, nearest first, for the map (ADR 0022). 422 outside the region."""
    point = geo.require_point(lat, lng)
    return marketplace.nearby_providers(
        session, point=point, radius_km=geo.clamp_radius(radius_km), category=category
    )


@router.get("/{slug}/blocked-days", response_model=list[date])
def read_provider_blocked_days(
    slug: str, session: Session = Depends(deps.get_session)
) -> list[date]:
    """Public. Days (Africa/Lagos) the provider takes no bookings, today to 180 days ahead,
    without the provider's notes (ADR 0028). 404 for a workspace that is not a provider."""
    workspace_id = marketplace.provider_workspace_id(session, slug)
    if workspace_id is None:
        raise HTTPException(status_code=404, detail="Provider not found.")
    return availability.public_blocked_days(session, workspace_id)


@router.get("/{slug}", response_model=ProviderDetail)
def read_provider(slug: str, session: Session = Depends(deps.get_session)) -> ProviderDetail:
    """Public. A provider business by workspace slug, with published listings and recent
    reviews. Workspaces without a `ProviderProfile` (e.g. the default one) are 404."""
    provider = marketplace.get_provider(session, slug)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found.")
    return provider
