from enum import Enum

from msflib.models import ModelBase
from sqlmodel import Field


class ProviderPhotoKind(str, Enum):
    profile = "profile"
    work = "work"


class ProviderPhoto(ModelBase, table=True):
    """A business photo stored through `msflib.utils.uploads` (ADR 0027). The locator fields
    rebuild the `StorageBlob` so the file can be deleted."""

    provider_workspace_id: int = Field(foreign_key="workspace.id", index=True)
    kind: ProviderPhotoKind
    url: str = Field(max_length=500)
    caption: str = Field(default="", max_length=140)
    storage_method: str = Field(max_length=20)
    parent_folder: str = Field(max_length=200)
    storage_bucket: str = Field(max_length=200)
    filename: str = Field(max_length=200)
    content_type: str | None = Field(default=None, max_length=100)
    size_bytes: int | None = None
