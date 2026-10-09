from datetime import date, datetime

from pydantic import BaseModel, Field


class ProviderRef(BaseModel):
    slug: str
    display_name: str


class ProviderPublic(ProviderRef):
    service_area: str
    rating_avg: float
    rating_count: int
    latitude: float | None
    longitude: float | None


class ProviderPhotoPublic(BaseModel):
    """`url` is relative to the API origin for local storage (ADR 0027)."""

    id: int
    url: str
    caption: str


class PinListing(BaseModel):
    id: int
    title: str
    pricing_type: str
    price_amount: int
    currency: str


class ProviderPin(ProviderPublic):
    """A provider on the map, nearest first, with the listings a customer can book (ADR 0022)."""

    distance_km: float
    listing_count: int
    categories: list[str]
    listings: list[PinListing]


class ProviderStats(BaseModel):
    published_listing_count: int
    open_booking_count: int
    completed_booking_count: int


class ProviderMine(ProviderPublic):
    id: int
    workspace_slug: str
    bio: str
    phone: str
    photo_url: str | None
    photos: list[ProviderPhotoPublic]
    stats: ProviderStats


class BlockedDayPublic(BaseModel):
    day: date
    note: str


class BlockedDayWrite(BaseModel):
    day: date
    note: str = Field(default="", max_length=140)


class ProviderWrite(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)
    bio: str = Field(default="", max_length=2000)
    service_area: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=7, max_length=32)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ProviderUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    service_area: str | None = Field(default=None, min_length=2, max_length=200)
    phone: str | None = Field(default=None, min_length=7, max_length=32)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class EarningsEntry(BaseModel):
    booking_id: int
    listing_title: str
    customer_name: str
    amount: int
    currency: str
    status: str
    updated_at: datetime


class Earnings(BaseModel):
    completed_count: int
    total_amount: int
    pending_amount: int
    currency: str
    recent: list[EarningsEntry]
