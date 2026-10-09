from msflib.models import ModelBase
from sqlmodel import Field


class Review(ModelBase, table=True):
    """One review per completed booking, by that booking's customer (ADR 0010)."""

    booking_id: int = Field(foreign_key="booking.id", unique=True)
    listing_id: int = Field(foreign_key="listing.id", index=True)
    provider_workspace_id: int = Field(foreign_key="workspace.id", index=True)
    customer_account_id: int = Field(foreign_key="account.id", index=True)
    rating: int = Field(ge=1, le=5)
    comment: str = ""
