from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.api import deps
from app.schemas.listing import ListingDetail, ListingList, ListingSort
from app.schemas.review import ReviewList
from app.services import geo, marketplace

router = APIRouter()

NOT_FOUND = "Listing not found."


@router.get("", response_model=ListingList)
def read_listings(
    session: Session = Depends(deps.get_session),
    category: str | None = Query(default=None, max_length=64),
    q: str | None = Query(default=None, max_length=100),
    area: str | None = Query(default=None, max_length=100),
    sort: ListingSort | None = None,
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0),
) -> ListingList:
    """Public. Published listings only, filtered and paginated. With `lat` and `lng` (inside
    the service region) only listings within `radius_km` are returned, each with
    `distance_km`; `sort=distance` (the default then) puts the nearest first."""
    point = geo.require_point(lat, lng)
    if sort == "distance" and point is None:
        raise HTTPException(status_code=422, detail="Sorting by distance needs lat and lng.")
    return marketplace.list_listings(
        session,
        category=category,
        q=q,
        area=area,
        sort=sort,
        limit=limit,
        offset=offset,
        point=point,
        radius_km=geo.clamp_radius(radius_km),
    )


@router.get("/{listing_id}", response_model=ListingDetail)
def read_listing(
    listing_id: int,
    session: Session = Depends(deps.get_session),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
) -> ListingDetail:
    """Public. 404 for draft, archived or unknown listings. `distance_km` when `lat`/`lng`
    are given."""
    listing = marketplace.get_listing(session, listing_id, geo.require_point(lat, lng))
    if listing is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return listing


@router.get("/{listing_id}/reviews", response_model=ReviewList)
def read_listing_reviews(
    listing_id: int,
    session: Session = Depends(deps.get_session),
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> ReviewList:
    """Public. Reviews of a published listing, newest first."""
    reviews = marketplace.list_listing_reviews(session, listing_id, limit=limit, offset=offset)
    if reviews is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return reviews
