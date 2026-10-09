"""Provider blocked days (ADR 0028). Days are calendar days in the service region's time zone;
stored booking times are naive UTC."""

from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from app.api.deps import ProviderContext
from app.models import ProviderBlockedDay
from app.schemas.provider import BlockedDayPublic, BlockedDayWrite

REGION_TZ = ZoneInfo("Africa/Lagos")
PUBLIC_WINDOW_DAYS = 180


def today() -> date:
    return datetime.now(REGION_TZ).date()


def local_day(naive_utc: datetime) -> date:
    return naive_utc.replace(tzinfo=UTC).astimezone(REGION_TZ).date()


def _upcoming(workspace_id: int, until: date | None = None):
    stmt = select(ProviderBlockedDay).where(
        ProviderBlockedDay.provider_workspace_id == workspace_id,
        ProviderBlockedDay.day >= today(),
    )
    if until is not None:
        stmt = stmt.where(ProviderBlockedDay.day <= until)
    return stmt.order_by(col(ProviderBlockedDay.day))


def list_blocked_days(session: Session, ctx: ProviderContext) -> list[BlockedDayPublic]:
    rows = session.exec(_upcoming(ctx.workspace.id)).all()
    return [BlockedDayPublic(day=r.day, note=r.note) for r in rows]


def public_blocked_days(session: Session, workspace_id: int) -> list[date]:
    until = today() + timedelta(days=PUBLIC_WINDOW_DAYS)
    return [r.day for r in session.exec(_upcoming(workspace_id, until)).all()]


def block_day(session: Session, ctx: ProviderContext, data: BlockedDayWrite) -> BlockedDayPublic:
    if data.day < today():
        raise HTTPException(status_code=422, detail="Choose today or a later date.")
    row = ProviderBlockedDay(
        provider_workspace_id=ctx.workspace.id, day=data.day, note=data.note.strip()
    )
    session.add(row)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="That day is already blocked.") from exc
    return BlockedDayPublic(day=row.day, note=row.note)


def unblock_day(session: Session, ctx: ProviderContext, day: date) -> None:
    row = session.exec(
        select(ProviderBlockedDay).where(
            ProviderBlockedDay.provider_workspace_id == ctx.workspace.id,
            ProviderBlockedDay.day == day,
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="That day is not blocked.")
    session.delete(row)
    session.commit()


def ensure_available(session: Session, workspace_id: int, scheduled_for: datetime) -> None:
    blocked = session.exec(
        select(ProviderBlockedDay.id).where(
            ProviderBlockedDay.provider_workspace_id == workspace_id,
            ProviderBlockedDay.day == local_day(scheduled_for),
        )
    ).first()
    if blocked is not None:
        raise HTTPException(
            status_code=409,
            detail="The provider is not available on that day. Pick another date.",
        )
