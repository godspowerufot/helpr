from itertools import product
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models import Booking, BookingActorRole, BookingStatus
from app.services.booking import TRANSITIONS, BookingService

S = BookingStatus
R = BookingActorRole

CASES = [
    (from_status, to_status, role)
    for from_status, to_status, role in product(S, S, (R.customer, R.provider))
]


def _booking(status: BookingStatus) -> Booking:
    return Booking(
        id=1,
        listing_id=1,
        provider_workspace_id=1,
        customer_account_id=1,
        status=status,
        scheduled_for="2030-01-01T09:00:00",
        address="1 Marina Road, Eket",
        price_amount=100,
    )


@pytest.mark.parametrize(("from_status", "to_status", "role"), CASES)
def test_every_status_pair_and_actor(
    from_status: BookingStatus, to_status: BookingStatus, role: BookingActorRole
) -> None:
    """ADR 0007: allowed moves succeed and write an event; unknown moves are 409; a known
    move by the wrong side is 403."""
    booking = _booking(from_status)
    session = MagicMock()
    allowed = TRANSITIONS.get((from_status, to_status))

    if allowed is None:
        with pytest.raises(HTTPException) as exc:
            BookingService.transition(
                session, booking, to_status, actor_role=role, actor_account_id=9, reason="r"
            )
        assert exc.value.status_code == 409
        assert booking.status == from_status
    elif role not in allowed:
        with pytest.raises(HTTPException) as exc:
            BookingService.transition(
                session, booking, to_status, actor_role=role, actor_account_id=9, reason="r"
            )
        assert exc.value.status_code == 403
        assert booking.status == from_status
    else:
        event = BookingService.transition(
            session, booking, to_status, actor_role=role, actor_account_id=9, reason="r"
        )
        assert booking.status == to_status
        assert (event.from_status, event.to_status, event.actor_role) == (
            from_status,
            to_status,
            role,
        )
        assert event.actor_account_id == 9


@pytest.mark.parametrize("terminal", [S.declined, S.cancelled, S.completed])
def test_terminal_states_have_no_exit(terminal: BookingStatus) -> None:
    assert not [move for move in TRANSITIONS if move[0] == terminal]


@pytest.mark.parametrize("role", [R.customer, R.provider])
def test_cancelling_an_accepted_booking_needs_a_reason(role: BookingActorRole) -> None:
    booking = _booking(S.accepted)
    with pytest.raises(HTTPException) as exc:
        BookingService.transition(
            MagicMock(), booking, S.cancelled, actor_role=role, actor_account_id=1, reason="  "
        )
    assert exc.value.status_code == 422
    assert booking.status == S.accepted


def test_paid_bookings_cannot_be_cancelled() -> None:
    assert (S.paid, S.cancelled) not in TRANSITIONS
