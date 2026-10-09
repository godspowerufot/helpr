from datetime import datetime

from msflib.models import BaseEnum, ModelBase
from sqlmodel import Field


class BookingStatus(BaseEnum):
    requested = "requested"
    accepted = "accepted"
    declined = "declined"
    cancelled = "cancelled"
    paid = "paid"
    completed = "completed"


class BookingActorRole(BaseEnum):
    customer = "customer"
    provider = "provider"
    system = "system"


class Booking(ModelBase, table=True):
    """Status changes only through `BookingService.transition()` (ADR 0007)."""

    listing_id: int = Field(foreign_key="listing.id", index=True)
    provider_workspace_id: int = Field(foreign_key="workspace.id", index=True)
    customer_account_id: int = Field(foreign_key="account.id", index=True)
    status: BookingStatus = Field(default=BookingStatus.requested, index=True)
    scheduled_for: datetime
    address: str = Field(max_length=300)
    notes: str = ""
    price_amount: int
    currency: str = Field(default="NGN", max_length=3)
    payment_id: int | None = Field(default=None, foreign_key="payment.id")
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class BookingEvent(ModelBase, table=True):
    booking_id: int = Field(foreign_key="booking.id", index=True)
    from_status: BookingStatus | None = None
    to_status: BookingStatus
    actor_account_id: int | None = Field(default=None, foreign_key="account.id")
    actor_role: BookingActorRole
    reason: str | None = None
