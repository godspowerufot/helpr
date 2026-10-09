from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.listing import ListingStatus, PricingType
from app.schemas.category import CategoryRef
from app.schemas.provider import ProviderPhotoPublic, ProviderPublic, ProviderRef
from app.schemas.review import ReviewPublic

ListingSort = Literal["price_asc", "price_desc", "rating", "distance"]


class ListingCard(BaseModel):
    id: int
    title: str
    description: str
    pricing_type: PricingType
    price_amount: int
    currency: str
    duration_minutes: int | None
    service_area: str
    rating_avg: float
    rating_count: int
    category: CategoryRef
    provider: ProviderRef
    latitude: float | None
    longitude: float | None
    distance_km: float | None = None


class ListingDetail(ListingCard):
    provider: ProviderPublic


class ListingList(BaseModel):
    items: list[ListingCard]
    total: int


class ProviderDetail(ProviderPublic):
    bio: str
    photo_url: str | None
    photos: list[ProviderPhotoPublic]
    listings: list[ListingCard]
    recent_reviews: list[ReviewPublic]


class ProviderListing(ListingCard):
    status: ListingStatus
    created_at: datetime
    updated_at: datetime


class ListingWrite(BaseModel):
    category_slug: str
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=4000)
    pricing_type: PricingType
    price_amount: int = Field(gt=0)
    currency: Literal["NGN"] = "NGN"
    duration_minutes: int | None = Field(default=None, gt=0)
    service_area: str = Field(min_length=2, max_length=200)


class ListingUpdate(BaseModel):
    category_slug: str | None = None
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=4000)
    pricing_type: PricingType | None = None
    price_amount: int | None = Field(default=None, gt=0)
    duration_minutes: int | None = Field(default=None, gt=0)
    service_area: str | None = Field(default=None, min_length=2, max_length=200)
