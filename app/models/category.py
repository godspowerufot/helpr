from msflib.models import ModelBase
from sqlmodel import Field


class Category(ModelBase, table=True):
    """Platform-wide service category (ADR 0006)."""

    slug: str = Field(unique=True, index=True, max_length=64)
    name: str = Field(max_length=80)
    icon: str | None = Field(default=None, max_length=64)
