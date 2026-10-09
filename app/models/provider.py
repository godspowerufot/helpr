from msflib.models import ModelBase
from sqlmodel import Field


class ProviderProfile(ModelBase, table=True):
    """A workspace is a provider business only if it has one of these (ADR 0005)."""

    workspace_id: int = Field(foreign_key="workspace.id", unique=True, index=True)
    display_name: str = Field(max_length=120)
    bio: str = ""
    service_area: str = Field(max_length=200)
    phone: str = Field(max_length=32)
    rating_avg: float = 0
    rating_count: int = 0
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
