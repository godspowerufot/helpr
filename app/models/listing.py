from msflib.models import BaseEnum, ModelBase
from sqlmodel import Field


class PricingType(BaseEnum):
    fixed = "fixed"
    hourly = "hourly"


class ListingStatus(BaseEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Listing(ModelBase, table=True):
    """One table for every service type (ADR 0006). Money in minor units (ADR 0011)."""

    provider_workspace_id: int = Field(foreign_key="workspace.id", index=True)
    category_id: int = Field(foreign_key="category.id", index=True)
    title: str = Field(max_length=120)
    description: str
    pricing_type: PricingType
    price_amount: int = Field(gt=0)
    currency: str = Field(default="NGN", max_length=3)
    duration_minutes: int | None = None
    service_area: str = Field(max_length=200)
    status: ListingStatus = Field(default=ListingStatus.draft, index=True)
    rating_avg: float = 0
    rating_count: int = 0
