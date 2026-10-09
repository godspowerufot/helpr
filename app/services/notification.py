"""Activity notifications through msflib-notifications, in-app channel only (ADR 0021).

The inbox payload has no link field (ADR 0031), so a destination is stored as a marker
on the end of `message` and stripped before display.
"""

import logging
import re

from msflib.notifications.service.notification import dispatch_account_notifications
from sqlalchemy import event as sa_event
from sqlmodel import Session, col, select

from app.core.config import settings
from app.models import (
    Account,
    AccountNotification,
    Booking,
    BookingStatus,
    Listing,
    Notification,
    NotificationChannel,
    NotificationCreate,
    NotificationType,
    User,
    UserType,
    Workspace,
)

# Last line of a message. The inbox hides it and navigates there (ADR 0031).
LINK_MARKER = "[[helpr:"
_BOOKING_ID_RE = re.compile(r"Booking #(\d+)")
_QUOTED_RE = re.compile(r"“([^”]+)”")

_CUSTOMER_TITLES = {
    "Booking accepted. Pay to confirm",
    "Booking declined",
    "Job completed. Leave a review",
}
_PROVIDER_TITLES = {"New booking request", "Booking paid", "New review"}
_STATUS_FOR_TITLE = {
    "New booking request": "requested",
    "Booking accepted. Pay to confirm": "accepted",
    "Booking declined": "declined",
    "Booking paid": "paid",
    "Job completed. Leave a review": "completed",
    "New review": "completed",
    "Booking cancelled": "cancelled",
}

logger = logging.getLogger(__name__)


def activity_href(booking_id: int, *, workspace_slug: str | None = None) -> str:
    """Customer booking page, or the provider booking page for one business."""
    if workspace_slug is None:
        return f"/bookings/view?id={booking_id}"
    return f"/provider/bookings/view?id={booking_id}&workspace={workspace_slug}"


def with_link(message: str, href: str) -> str:
    """Append the in-app destination. `href` is a path this app serves, nothing else."""
    if LINK_MARKER in message:
        return message
    if (
        not href.startswith("/")
        or "://" in href
        or "\n" in href
        or "]" in href
        or not href.startswith(("/bookings/view?id=", "/provider/bookings/view?id="))
    ):
        raise ValueError("Notification link must be an in-app booking path.")
    return f"{message}\n[[helpr:{href}]]"


def _for_provider(title: str, message: str) -> bool | None:
    if title in _PROVIDER_TITLES:
        return True
    if title in _CUSTOMER_TITLES:
        return False
    if title == "Booking cancelled":
        # Customer cancel tells the provider "Booking #n was cancelled."
        return message.startswith("Booking #")
    return None


def link_unlinked_notifications(session: Session) -> int:
    """Fill in destinations for activity rows stored before links existed.

    Matches `Booking #id` or the quoted listing title, then the receiver: the customer,
    or an owner/admin of that provider. Ambiguous rows are left unchanged.
    """
    rows = session.exec(
        select(Notification).where(col(Notification.message).notlike(f"%{LINK_MARKER}%"))
    ).all()
    linked = 0
    for notification in rows:
        audience = _for_provider(notification.title, notification.message)
        if audience is None:
            continue
        receivers = list(
            session.exec(
                select(AccountNotification.receiver_id).where(
                    AccountNotification.notification_id == notification.id
                )
            ).all()
        )
        booking = _match_booking(session, notification, receivers, for_provider=audience)
        if booking is None:
            continue
        slug = None
        if audience:
            workspace = session.get(Workspace, booking.provider_workspace_id)
            if workspace is None:
                continue
            slug = workspace.slug
        notification.message = with_link(
            notification.message, activity_href(booking.id, workspace_slug=slug)
        )
        session.add(notification)
        linked += 1
    if linked:
        session.commit()
    return linked


def _match_booking(
    session: Session,
    notification: Notification,
    receiver_ids: list[int],
    *,
    for_provider: bool,
) -> Booking | None:
    if not receiver_ids:
        return None
    id_match = _BOOKING_ID_RE.search(notification.message)
    if id_match:
        found = session.get(Booking, int(id_match.group(1)))
        candidates = [found] if found is not None else []
    else:
        titles = _QUOTED_RE.findall(notification.message)
        if not titles:
            return None
        listing_ids = list(
            session.exec(select(Listing.id).where(col(Listing.title).in_(titles))).all()
        )
        if not listing_ids:
            return None
        candidates = list(
            session.exec(select(Booking).where(col(Booking.listing_id).in_(listing_ids))).all()
        )
    if for_provider:
        workspace_ids = set(
            session.exec(
                select(User.workspace_id).where(
                    col(User.account_id).in_(receiver_ids),
                    col(User.type).in_([UserType.owner, UserType.admin]),
                )
            ).all()
        )
        candidates = [b for b in candidates if b.provider_workspace_id in workspace_ids]
    else:
        allowed = set(receiver_ids)
        candidates = [b for b in candidates if b.customer_account_id in allowed]
    wanted = _STATUS_FOR_TITLE.get(notification.title)
    status = BookingStatus(wanted) if wanted else None
    matching = [b for b in candidates if status is None or b.status == status]
    pool = matching or candidates
    if not pool:
        return None
    return max(pool, key=lambda booking: booking.id)


def notify_accounts(
    session: Session, receivers: list[Account], title: str, message: str
) -> Notification | None:
    """Store an in-app notification for each receiver.

    Commits. Call only after the business change it reports has been committed.
    """
    if not receivers:
        return None
    return dispatch_account_notifications(
        session=session,
        settings=settings,
        data=NotificationCreate(title=title, message=message, channels=[NotificationChannel.inapp]),
        n_type=NotificationType.system,
        receivers=receivers,
    )


def notify_after_commit(
    session: Session, receiver_ids: list[int], title: str, message: str
) -> None:
    """Send once `session` commits, in a fresh session; dropped if it rolls back.

    For code that must not commit itself (the payment-queue listener) and for services that
    want the notification tied to their own commit. A failed dispatch is logged, never raised:
    the business change is already saved.
    """
    state = {"pending": True}

    def _cancel(_session) -> None:
        state["pending"] = False

    def _send(committed: Session) -> None:
        if not state["pending"]:
            return
        state["pending"] = False
        try:
            with Session(committed.get_bind()) as fresh:
                receivers = list(
                    fresh.exec(select(Account).where(col(Account.id).in_(receiver_ids))).all()
                )
                notify_accounts(fresh, receivers, title, message)
        except Exception:
            logger.exception("Notification %r could not be sent", title)

    sa_event.listen(session, "after_commit", _send)
    sa_event.listen(session, "after_soft_rollback", _cancel)


def provider_managers(session: Session, workspace_id: int) -> list[Account]:
    """Owner and admins of a provider workspace: who hears about its bookings."""
    return list(
        session.exec(
            select(Account)
            .join(User, User.account_id == Account.id)
            .where(
                User.workspace_id == workspace_id,
                User.type.in_([UserType.owner, UserType.admin]),
            )
        ).all()
    )
