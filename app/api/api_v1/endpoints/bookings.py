from fastapi import APIRouter, Body, Depends
from sqlmodel import Session

from app.api import deps
from app.models import Account, Booking, BookingStatus
from app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingReason,
    BookingSummary,
    PaymentCheckout,
)
from app.schemas.review import ReviewCreate, ReviewPublic
from app.services import booking as service

router = APIRouter()


@router.post("", response_model=BookingDetail, status_code=201)
def request_booking(
    data: BookingCreate,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> BookingDetail:
    """Customer. Request a published listing for a future time; optional job-site
    coordinates must be inside the service region. 403 for your own provider's listing."""
    return service.booking_detail(session, service.create_booking(session, account, data))


@router.get("/mine", response_model=list[BookingSummary])
def read_my_bookings(
    status: BookingStatus | None = None,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> list[BookingSummary]:
    """Customer. My bookings, newest first."""
    filters = [Booking.customer_account_id == account.id]
    if status:
        filters.append(Booking.status == status)
    return service.list_bookings(session, *filters)


@router.get("/{booking_id}", response_model=BookingDetail)
def read_booking(
    booking_id: int,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> BookingDetail:
    """Customer of the booking only (403 otherwise). Includes the event timeline."""
    return service.booking_detail(
        session, service.get_customer_booking(session, booking_id, account)
    )


@router.post("/{booking_id}/cancel", response_model=BookingDetail)
def cancel_booking(
    booking_id: int,
    data: BookingReason = Body(default_factory=BookingReason),
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> BookingDetail:
    """Customer. `requested` or `accepted` (reason required) only; otherwise 409."""
    booking = service.customer_cancel(session, booking_id, account, data.reason)
    return service.booking_detail(session, booking)


@router.post("/{booking_id}/pay", response_model=PaymentCheckout)
async def pay_booking(
    booking_id: int,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> PaymentCheckout:
    """Customer. Starts a Paystack (test mode) checkout for an `accepted` booking through
    msflib-payments. Send the browser to `authorization_url`; on return call
    `GET /payments/verify/{reference}`, which moves the booking to `paid`."""
    return await service.start_payment(session, booking_id, account)


@router.post("/{booking_id}/review", response_model=ReviewPublic, status_code=201)
def review_booking(
    booking_id: int,
    data: ReviewCreate,
    session: Session = Depends(deps.get_session),
    account: Account = Depends(deps.get_current_active_account),
) -> ReviewPublic:
    """Customer of a `completed` booking, once (409 otherwise)."""
    return service.create_review(session, booking_id, account, data)
