"""Provider photos stored through `msflib.utils.uploads` (ADR 0027)."""

from uuid import uuid4

from fastapi import HTTPException, UploadFile
from msflib.utils.uploads import (
    StorageBlob,
    StorageMethod,
    delete_blob,
    save_file_blob,
    validate_upload,
)
from sqlmodel import Session, col, select

from app.api.deps import ProviderContext
from app.core.config import settings
from app.models import ProviderPhoto, ProviderPhotoKind
from app.schemas.provider import ProviderPhotoPublic

MAX_BYTES = 5 * 1024 * 1024
MAX_WORK_PHOTOS = 8
ALLOWED_TYPES = ("image/jpeg", "image/png", "image/webp")


def _sniff(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def _store(file: UploadFile, workspace_id: int) -> StorageBlob:
    validate_upload(file, max_bytes=MAX_BYTES, allowed_content_types=ALLOWED_TYPES)
    head = file.file.read(12)
    file.file.seek(0)
    ext = _sniff(head)
    if ext is None:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG or WebP image.")
    return save_file_blob(
        file,
        parent_folder="images",
        storage_bucket=f"providers/{workspace_id}",
        filename=f"{uuid4().hex}.{ext}",
        settings=settings,
        storage_method=StorageMethod(settings.STORAGE_METHOD or "file"),
    )


def _remove_file(photo: ProviderPhoto) -> None:
    delete_blob(
        StorageBlob(
            url=photo.url,
            storage_method=photo.storage_method,
            parent_folder=photo.parent_folder,
            storage_bucket=photo.storage_bucket,
            filename=photo.filename,
        ),
        settings,
    )


def _row(workspace_id: int, kind: ProviderPhotoKind, blob: StorageBlob, caption: str):
    return ProviderPhoto(
        provider_workspace_id=workspace_id,
        kind=kind,
        url=blob.url,
        caption=caption,
        storage_method=blob.storage_method,
        parent_folder=blob.parent_folder,
        storage_bucket=blob.storage_bucket,
        filename=blob.filename,
        content_type=blob.content_type,
        size_bytes=blob.size_bytes,
    )


def photo_public(photo: ProviderPhoto) -> ProviderPhotoPublic:
    return ProviderPhotoPublic(id=photo.id, url=photo.url, caption=photo.caption)


def profile_photo(session: Session, workspace_id: int) -> ProviderPhoto | None:
    return session.exec(
        select(ProviderPhoto).where(
            ProviderPhoto.provider_workspace_id == workspace_id,
            ProviderPhoto.kind == ProviderPhotoKind.profile,
        )
    ).first()


def work_photos(session: Session, workspace_id: int) -> list[ProviderPhoto]:
    return list(
        session.exec(
            select(ProviderPhoto)
            .where(
                ProviderPhoto.provider_workspace_id == workspace_id,
                ProviderPhoto.kind == ProviderPhotoKind.work,
            )
            .order_by(col(ProviderPhoto.created_at), col(ProviderPhoto.id))
        ).all()
    )


def set_profile_photo(session: Session, ctx: ProviderContext, file: UploadFile) -> None:
    """Store the new file first, then replace the row; the old file is removed last."""
    blob = _store(file, ctx.workspace.id)
    old = profile_photo(session, ctx.workspace.id)
    session.add(_row(ctx.workspace.id, ProviderPhotoKind.profile, blob, ""))
    if old is not None:
        session.delete(old)
    session.commit()
    if old is not None:
        _remove_file(old)


def remove_profile_photo(session: Session, ctx: ProviderContext) -> None:
    old = profile_photo(session, ctx.workspace.id)
    if old is None:
        raise HTTPException(status_code=404, detail="No profile photo to remove.")
    session.delete(old)
    session.commit()
    _remove_file(old)


def add_work_photo(
    session: Session, ctx: ProviderContext, file: UploadFile, caption: str
) -> ProviderPhotoPublic:
    if len(work_photos(session, ctx.workspace.id)) >= MAX_WORK_PHOTOS:
        raise HTTPException(
            status_code=409,
            detail=f"You can show up to {MAX_WORK_PHOTOS} work photos. Remove one first.",
        )
    blob = _store(file, ctx.workspace.id)
    photo = _row(ctx.workspace.id, ProviderPhotoKind.work, blob, caption.strip())
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo_public(photo)


def remove_work_photo(session: Session, ctx: ProviderContext, photo_id: int) -> None:
    photo = session.get(ProviderPhoto, photo_id)
    if (
        photo is None
        or photo.provider_workspace_id != ctx.workspace.id
        or photo.kind != ProviderPhotoKind.work
    ):
        raise HTTPException(status_code=404, detail="Photo not found.")
    session.delete(photo)
    session.commit()
    _remove_file(photo)
