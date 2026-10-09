from datetime import date

from msflib.models import ModelBase
from sqlalchemy import UniqueConstraint
from sqlmodel import Field


class ProviderBlockedDay(ModelBase, table=True):
    """A calendar day (Africa/Lagos) the business takes no new bookings (ADR 0028)."""

    __table_args__ = (UniqueConstraint("provider_workspace_id", "day"),)

    provider_workspace_id: int = Field(foreign_key="workspace.id", index=True)
    day: date = Field(index=True)
    note: str = Field(default="", max_length=140)
