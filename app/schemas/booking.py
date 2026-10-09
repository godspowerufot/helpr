from datetime import datetime

from pydantic import BaseModel, Field

from app.models.booking import BookingActorRole, BookingStatus
from app.schemas.provider import ProviderRef
from app.schemas.review import ReviewPublic


class BookingCreate(BaseModel):
    listing_id: int
    scheduled_for: datetime
    address: str = Field(min_length=3, max_length=300)
    notes: str = Field(default="", max_length=2000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class BookingReason(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class BookingEventRead(BaseModel):
    id: int
    from_status: BookingStatus | None
    to_status: BookingStatus
    actor_role: BookingActorRole
    reason: str | None
    created_at: datetime


class BookingListingRef(BaseModel):
    id: int
    title: str


class BookingPaymentSummary(BaseModel):
    id: int
    reference: str
    status: str


class BookingSummary(BaseModel):
    id: int
    status: BookingStatus
    scheduled_for: datetime
    address: str
    latitude: float | None
    longitude: float | None
    price_amount: int
    currency: str
    listing: BookingListingRef
    provider: ProviderRef
    customer_name: str
    created_at: datetime
    updated_at: datetime


class BookingDetail(BookingSummary):
    notes: str
    distance_km: float | None
    events: list[BookingEventRead]
    payment: BookingPaymentSummary | None
    review: ReviewPublic | None


class PaymentCheckout(BaseModel):
    payment_id: int
    reference: str
    authorization_url: str
