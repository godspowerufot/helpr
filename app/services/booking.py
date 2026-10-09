"""Bookings (ADR 0007), Paystack payment start and fulfilment (ADR 0019), reviews (ADR 0010)
and the activity notifications they trigger (ADR 0021)."""

import logging
from datetime import UTC, datetime

from fastapi import HTTPException
from msflib.payments.models import PaymentData, PaymentGateway
from msflib.payments.service.error import PaymentError
from msflib.payments.service.processor import process_payment
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.core.config import settings
from app.models import (
    Account,
    Booking,
    BookingActorRole,
    BookingEvent,
    BookingStatus,
    Listing,
    ListingStatus,
    Payment,
    PaymentQueue,
    Profile,
    ProviderProfile,
    Review,
    User,
    Workspace,
)
from app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingEventRead,
    BookingListingRef,
    BookingPaymentSummary,
    BookingSummary,
    PaymentCheckout,
)
from app.schemas.provider import ProviderRef
from app.schemas.review import ReviewCreate, ReviewPublic
from app.services import availability, geo
from app.services.marketplace import customer_display_name, review_public
from app.services.notification import (
    activity_href,
    notify_after_commit,
    provider_managers,
    with_link,
)

logger = logging.getLogger(__name__)

PAYMENT_EVENT_KEY = "booking-payment"

S = BookingStatus
R = BookingActorRole

# (from, to) -> roles allowed to make that move. Everything else is 409 (ADR 0007).
TRANSITIONS: dict[tuple[BookingStatus, BookingStatus], set[BookingActorRole]] = {
    (S.requested, S.accepted): {R.provider},
    (S.requested, S.declined): {R.provider},
    (S.requested, S.cancelled): {R.customer},
    (S.accepted, S.paid): {R.customer},
    (S.accepted, S.cancelled): {R.customer, R.provider},
    (S.paid, S.completed): {R.provider},
}
REASON_REQUIRED = {(S.accepted, S.cancelled)}
OPEN_STATUSES = (S.requested, S.accepted, S.paid)


class BookingService:
    @staticmethod
    def transition(
        session: Session,
        booking: Booking,
        to_status: BookingStatus,
        *,
        actor_role: BookingActorRole,
        actor_account_id: int | None,
        reason: str | None = None,
    ) -> BookingEvent:
        """The only code that changes `booking.status`. Adds the audit event; never commits."""
        move = (booking.status, to_status)
        roles = TRANSITIONS.get(move)
        if roles is None:
            raise HTTPException(
                status_code=409,
                detail=f"A {booking.status} booking cannot become {to_status}.",
            )
        if actor_role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"A {actor_role} cannot move a booking from {booking.status} to {to_status}.",
            )
        reason = (reason or "").strip() or None
        if move in REASON_REQUIRED and not reason:
            raise HTTPException(
                status_code=422, detail="A reason is required to cancel an accepted booking."
            )

        event = BookingEvent(
            booking_id=booking.id,
            from_status=booking.status,
            to_status=to_status,
            actor_account_id=actor_account_id,
            actor_role=actor_role,
            reason=reason,
        )
        booking.status = to_status
        session.add(booking)
        session.add(event)
        return event


# --- reads -------------------------------------------------------------------------------


def _customer_name(session: Session, account_id: int) -> str:
    account = session.get(Account, account_id)
    if account is None:
        return "Helpr customer"
    return customer_display_name(account, session.get(Profile, account_id))


def _summary_rows(session: Session, *filters):
    return session.exec(
        select(Booking, Listing, ProviderProfile, Workspace)
        .join(Listing, Listing.id == Booking.listing_id)
        .join(ProviderProfile, ProviderProfile.workspace_id == Booking.provider_workspace_id)
        .join(Workspace, Workspace.id == Booking.provider_workspace_id)
        .where(*filters)
        .order_by(col(Booking.created_at).desc(), col(Booking.id).desc())
    ).all()


def _summary(
    session: Session,
    booking: Booking,
    listing: Listing,
    provider: ProviderProfile,
    workspace: Workspace,
) -> BookingSummary:
    return BookingSummary(
        id=booking.id,
        status=booking.status,
        scheduled_for=booking.scheduled_for,
        address=booking.address,
        latitude=booking.latitude,
        longitude=booking.longitude,
        price_amount=booking.price_amount,
        currency=booking.currency,
        listing=BookingListingRef(id=listing.id, title=listing.title),
        provider=ProviderRef(slug=workspace.slug, display_name=provider.display_name),
        customer_name=_customer_name(session, booking.customer_account_id),
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def list_bookings(session: Session, *filters) -> list[BookingSummary]:
    return [_summary(session, *row) for row in _summary_rows(session, *filters)]


def booking_detail(session: Session, booking: Booking) -> BookingDetail:
    session.refresh(booking)
    booking_row, listing, provider, workspace = _summary_rows(session, Booking.id == booking.id)[0]
    events = session.exec(
        select(BookingEvent)
        .where(BookingEvent.booking_id == booking.id)
        .order_by(col(BookingEvent.created_at), col(BookingEvent.id))
    ).all()
    payment = session.get(Payment, booking.payment_id) if booking.payment_id else None
    review_row = session.exec(
        select(Review, Account, Profile)
        .join(Account, Account.id == Review.customer_account_id)
        .outerjoin(Profile, Profile.id == Account.id)
        .where(Review.booking_id == booking.id)
    ).first()
    distance = None
    if None not in (booking.latitude, booking.longitude, provider.latitude, provider.longitude):
        distance = round(
            geo.haversine_km(
                booking.latitude, booking.longitude, provider.latitude, provider.longitude
            ),
            2,
        )
    return BookingDetail(
        **_summary(session, booking_row, listing, provider, workspace).model_dump(),
        notes=booking.notes,
        distance_km=distance,
        events=[BookingEventRead.model_validate(e, from_attributes=True) for e in events],
        payment=BookingPaymentSummary(
            id=payment.id, reference=payment.reference, status=str(payment.status)
        )
        if payment
        else None,
        review=review_public(*review_row) if review_row else None,
    )


def get_customer_booking(session: Session, booking_id: int, account: Account) -> Booking:
    booking = session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.customer_account_id != account.id:
        raise HTTPException(status_code=403, detail="This is not your booking.")
    return booking


# --- customer actions --------------------------------------------------------------------


def _is_member(session: Session, account_id: int, workspace_id: int) -> bool:
    return (
        session.exec(
            select(User).where(User.account_id == account_id, User.workspace_id == workspace_id)
        ).first()
        is not None
    )


def _notify_provider(session: Session, booking: Booking, title: str, message: str) -> None:
    receivers = [a.id for a in provider_managers(session, booking.provider_workspace_id)]
    workspace = session.get(Workspace, booking.provider_workspace_id)
    notify_after_commit(
        session,
        receivers,
        title,
        with_link(message, activity_href(booking.id, workspace_slug=workspace.slug)),
    )


def _notify_customer(session: Session, booking: Booking, title: str, message: str) -> None:
    notify_after_commit(
        session,
        [booking.customer_account_id],
        title,
        with_link(message, activity_href(booking.id)),
    )


def create_booking(session: Session, account: Account, data: BookingCreate) -> Booking:
    listing = session.get(Listing, data.listing_id)
    if listing is None or listing.status != ListingStatus.published:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if _is_member(session, account.id, listing.provider_workspace_id):
        raise HTTPException(
            status_code=403, detail="You cannot book a listing from your own provider business."
        )
    scheduled_for = data.scheduled_for
    if scheduled_for.tzinfo is not None:
        scheduled_for = scheduled_for.astimezone(UTC).replace(tzinfo=None)
    if scheduled_for <= datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(status_code=422, detail="Choose a date and time in the future.")
    availability.ensure_available(session, listing.provider_workspace_id, scheduled_for)
    point = geo.require_point(data.latitude, data.longitude)

    booking = Booking(
        listing_id=listing.id,
        provider_workspace_id=listing.provider_workspace_id,
        customer_account_id=account.id,
        status=S.requested,
        scheduled_for=scheduled_for,
        address=data.address.strip(),
        notes=data.notes.strip(),
        price_amount=listing.price_amount,
        currency=listing.currency,
        latitude=point[0] if point else None,
        longitude=point[1] if point else None,
    )
    session.add(booking)
    session.flush()
    session.add(
        BookingEvent(
            booking_id=booking.id,
            to_status=S.requested,
            actor_account_id=account.id,
            actor_role=R.customer,
        )
    )
    _notify_provider(
        session,
        booking,
        "New booking request",
        f"{customer_display_name(account, session.get(Profile, account.id))} requested "
        f"“{listing.title}” for {scheduled_for:%a %d %b, %H:%M}.",
    )
    session.commit()
    return booking


def customer_cancel(
    session: Session, booking_id: int, account: Account, reason: str | None
) -> Booking:
    booking = get_customer_booking(session, booking_id, account)
    BookingService.transition(
        session,
        booking,
        S.cancelled,
        actor_role=R.customer,
        actor_account_id=account.id,
        reason=reason,
    )
    _notify_provider(session, booking, "Booking cancelled", f"Booking #{booking.id} was cancelled.")
    session.commit()
    return booking


async def start_payment(session: Session, booking_id: int, account: Account) -> PaymentCheckout:
    booking = get_customer_booking(session, booking_id, account)
    if booking.status != S.accepted:
        raise HTTPException(
            status_code=409,
            detail=f"Only accepted bookings can be paid; this one is {booking.status}.",
        )
    if not settings.scope("PAYMENTS").PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payments are not configured.")
    listing = session.get(Listing, booking.listing_id)
    try:
        payment = await process_payment(
            session,
            payment_data=PaymentData(
                email=account.email,
                amount=booking.price_amount / 100,
                gateway=PaymentGateway.paystack,
                description=f"Helpr booking #{booking.id}: {listing.title}",
            ),
            account=account,
            settings=settings,
            queue_event_key=PAYMENT_EVENT_KEY,
            queue_data={"booking_id": booking.id},
            metadata={"booking_id": booking.id, "currency": booking.currency},
        )
    except PaymentError as e:
        session.rollback()
        logger.exception("Paystack initiation failed for booking %s", booking.id)
        raise HTTPException(status_code=502, detail="Could not start the payment.") from e
    booking.payment_id = payment.id
    session.add(booking)
    session.commit()
    return PaymentCheckout(
        payment_id=payment.id,
        reference=payment.reference,
        authorization_url=payment.authorization_url,
    )


def on_payment_verified(queue: PaymentQueue, context: dict) -> None:
    """`payment-queue-execute-booking-payment` listener (ADR 0019). Runs inside the verify
    request's transaction: must not commit; the notification waits for that commit."""
    session: Session = context["session"]
    booking_id = (queue.data or {}).get("booking_id")
    booking = session.get(Booking, booking_id) if booking_id else None
    if booking is None:
        logger.warning("Verified payment %s has no booking", queue.payment_id)
        return
    if booking.status != S.accepted:
        logger.info("Booking %s is %s; payment noted, no transition", booking.id, booking.status)
        return
    payment = session.get(Payment, queue.payment_id)
    BookingService.transition(
        session,
        booking,
        S.paid,
        actor_role=R.customer,
        actor_account_id=payment.account_id if payment else booking.customer_account_id,
    )
    booking.payment_id = queue.payment_id
    _notify_provider(
        session,
        booking,
        "Booking paid",
        f"Booking #{booking.id} was paid through Paystack. You can do the job.",
    )


def create_review(
    session: Session, booking_id: int, account: Account, data: ReviewCreate
) -> ReviewPublic:
    booking = get_customer_booking(session, booking_id, account)
    if booking.status != S.completed:
        raise HTTPException(
            status_code=409, detail="You can review a booking once it is completed."
        )
    if session.exec(select(Review).where(Review.booking_id == booking.id)).first():
        raise HTTPException(status_code=409, detail="You have already reviewed this booking.")
    review = Review(
        booking_id=booking.id,
        listing_id=booking.listing_id,
        provider_workspace_id=booking.provider_workspace_id,
        customer_account_id=account.id,
        rating=data.rating,
        comment=data.comment.strip(),
    )
    session.add(review)
    session.flush()
    refresh_ratings(session, booking.listing_id, booking.provider_workspace_id)
    listing = session.get(Listing, booking.listing_id)
    name = customer_display_name(account, session.get(Profile, account.id))
    _notify_provider(
        session, booking, "New review", f"{name} rated “{listing.title}” {data.rating}/5."
    )
    session.commit()
    session.refresh(review)
    return review_public(review, account, session.get(Profile, account.id))


def refresh_ratings(session: Session, listing_id: int, workspace_id: int) -> None:
    """Recompute rating average and count for one listing and its provider (ADR 0010)."""

    def stats(*filters) -> tuple[float, int]:
        avg, count = session.exec(
            select(func.avg(Review.rating), func.count()).where(*filters)
        ).one()
        return (round(float(avg), 1) if count else 0.0), int(count)

    listing = session.get(Listing, listing_id)
    listing.rating_avg, listing.rating_count = stats(Review.listing_id == listing_id)
    session.add(listing)
    provider = session.exec(
        select(ProviderProfile).where(ProviderProfile.workspace_id == workspace_id)
    ).one()
    provider.rating_avg, provider.rating_count = stats(Review.provider_workspace_id == workspace_id)
    session.add(provider)


# --- provider actions --------------------------------------------------------------------

PROVIDER_ACTIONS: dict[str, tuple[BookingStatus, str, str]] = {
    "accept": (S.accepted, "Booking accepted. Pay to confirm", "accepted your booking"),
    "decline": (S.declined, "Booking declined", "declined your booking"),
    "cancel": (S.cancelled, "Booking cancelled", "cancelled your booking"),
    "complete": (S.completed, "Job completed. Leave a review", "marked the job as completed"),
}


def get_provider_booking(session: Session, booking_id: int, workspace_id: int) -> Booking:
    booking = session.get(Booking, booking_id)
    if booking is None or booking.provider_workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking


def provider_act(
    session: Session,
    booking_id: int,
    action: str,
    *,
    workspace_id: int,
    provider: ProviderProfile,
    account: Account,
    reason: str | None,
) -> Booking:
    booking = get_provider_booking(session, booking_id, workspace_id)
    to_status, title, verb = PROVIDER_ACTIONS[action]
    BookingService.transition(
        session,
        booking,
        to_status,
        actor_role=R.provider,
        actor_account_id=account.id,
        reason=reason,
    )
    listing = session.get(Listing, booking.listing_id)
    _notify_customer(session, booking, title, f"{provider.display_name} {verb}: “{listing.title}”.")
    session.commit()
    return booking


def open_booking_count(session: Session, workspace_id: int) -> int:
    return session.exec(
        select(func.count())
        .select_from(Booking)
        .where(
            Booking.provider_workspace_id == workspace_id,
            col(Booking.status).in_(OPEN_STATUSES),
        )
    ).one()
