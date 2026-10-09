from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import models
from app.core.config import settings
from app.services import booking as booking_service

API = settings.API_V1_STR
SPARKLE = "sparkle-home"


def _future(days: int = 3) -> str:
    return (datetime.now(UTC) + timedelta(days=days)).isoformat()


def _listing(session: Session, title: str) -> models.Listing:
    return session.exec(select(models.Listing).where(models.Listing.title == title)).one()


def _request(client: TestClient, headers: dict, listing_id: int, **extra):
    body = {
        "listing_id": listing_id,
        "scheduled_for": _future(),
        "address": "5 Grace Bill Road, Eket",
        "notes": "Second floor",
        **extra,
    }
    return client.post(f"{API}/bookings", json=body, headers=headers)


def _titles(session: Session, email: str) -> list[str]:
    account = session.exec(select(models.Account).where(models.Account.email == email)).one()
    session.expire_all()
    return [
        n.title
        for n in session.exec(
            select(models.Notification)
            .join(models.AccountNotification)
            .where(models.AccountNotification.receiver_id == account.id)
        ).all()
    ]


@pytest.fixture
def deep_clean(marketplace: Session) -> models.Listing:
    return _listing(marketplace, "Deep Clean, 3-Bedroom Apartment")


def test_request_booking(client, marketplace, login, deep_clean) -> None:
    headers = login("temi@example.com")
    r = _request(client, headers, deep_clean.id, latitude=4.6455, longitude=7.9241)
    assert r.status_code == 201, r.text
    booking = r.json()
    assert booking["status"] == "requested"
    assert booking["price_amount"] == deep_clean.price_amount
    assert booking["provider"]["slug"] == SPARKLE
    assert booking["customer_name"] == "Temi B."
    assert [e["to_status"] for e in booking["events"]] == ["requested"]
    assert 0 < booking["distance_km"] < 2
    assert "New booking request" in _titles(marketplace, "sparkle@example.com")

    mine = client.get(f"{API}/bookings/mine", headers=headers).json()
    assert booking["id"] in [b["id"] for b in mine]
    only_paid = client.get(f"{API}/bookings/mine", params={"status": "paid"}, headers=headers)
    assert booking["id"] not in [b["id"] for b in only_paid.json()]


def test_request_rules(client, marketplace, login, deep_clean) -> None:
    headers = login("temi@example.com")
    assert client.post(f"{API}/bookings", json={}).status_code == 401
    assert _request(client, headers, deep_clean.id, scheduled_for=_future(-1)).status_code == 422
    lagos = _request(client, headers, deep_clean.id, latitude=6.45, longitude=3.47)
    assert lagos.status_code == 422
    assert "Eket" in lagos.json()["detail"]
    draft = _listing(marketplace, "Post-Construction Clean")
    assert _request(client, headers, draft.id).status_code == 404

    own = _request(client, login("sparkle@example.com"), deep_clean.id)
    assert own.status_code == 403


def test_only_the_customer_sees_a_booking(client, marketplace, login, deep_clean) -> None:
    booking = _request(client, login("temi@example.com"), deep_clean.id).json()
    other = login("david@example.com")
    assert client.get(f"{API}/bookings/{booking['id']}", headers=other).status_code == 403
    assert (
        client.post(f"{API}/bookings/{booking['id']}/cancel", json={}, headers=other).status_code
        == 403
    )
    assert client.get(f"{API}/bookings/999999", headers=other).status_code == 404
    assert client.get(f"{API}/bookings/{booking['id']}").status_code == 401


def test_customer_cancel_rules(client, marketplace, login, deep_clean) -> None:
    headers = login("temi@example.com")
    provider = login("sparkle@example.com")

    requested = _request(client, headers, deep_clean.id).json()
    r = client.post(f"{API}/bookings/{requested['id']}/cancel", json={}, headers=headers)
    assert r.json()["status"] == "cancelled"
    again = client.post(f"{API}/bookings/{requested['id']}/cancel", json={}, headers=headers)
    assert again.status_code == 409

    accepted = _request(client, headers, deep_clean.id).json()
    client.post(f"{API}/{SPARKLE}/provider/bookings/{accepted['id']}/accept", headers=provider)
    no_reason = client.post(f"{API}/bookings/{accepted['id']}/cancel", json={}, headers=headers)
    assert no_reason.status_code == 422
    r = client.post(
        f"{API}/bookings/{accepted['id']}/cancel", json={"reason": "Travelling"}, headers=headers
    )
    assert r.json()["status"] == "cancelled"
    assert r.json()["events"][-1]["reason"] == "Travelling"


def _fake_process_payment(session: Session):
    async def fake(
        session_, *, payment_data, account, settings, queue_event_key, queue_data, metadata
    ):
        payment = models.Payment(
            account_id=account.id,
            email=payment_data.email,
            description=payment_data.description,
            amount=payment_data.amount,
            callback_url=None,
            data=metadata,
            authorization_url="https://checkout.paystack.com/test",
            access_code="test",
            reference=f"TEST-{queue_data['booking_id']}",
            status=models.PaymentStatus.unverified,
            gateway="paystack",
        )
        session_.add(payment)
        session_.flush()
        session_.add(
            models.PaymentQueue(
                payment_id=payment.id,
                entity_id=None,
                event_key=queue_event_key,
                data=queue_data,
                status="queued",
            )
        )
        session_.flush()
        return payment

    return fake


def test_pay_and_verify_moves_booking_to_paid(
    client, marketplace, login, deep_clean, monkeypatch
) -> None:
    headers = login("temi@example.com")
    provider = login("sparkle@example.com")
    booking = _request(client, headers, deep_clean.id).json()
    pay_url = f"{API}/bookings/{booking['id']}/pay"

    assert client.post(pay_url, headers=headers).status_code == 409
    client.post(f"{API}/{SPARKLE}/provider/bookings/{booking['id']}/accept", headers=provider)
    assert "Booking accepted. Pay to confirm" in _titles(marketplace, "temi@example.com")
    assert client.post(pay_url, headers=login("david@example.com")).status_code == 403

    payments = settings.scope("PAYMENTS")
    monkeypatch.setattr(payments, "PAYSTACK_SECRET_KEY", "")
    assert client.post(pay_url, headers=headers).status_code == 503
    monkeypatch.setattr(payments, "PAYSTACK_SECRET_KEY", "sk_test_dummy")
    monkeypatch.setattr(booking_service, "process_payment", _fake_process_payment(marketplace))

    checkout = client.post(pay_url, headers=headers)
    assert checkout.status_code == 200, checkout.text
    reference = checkout.json()["reference"]
    assert checkout.json()["authorization_url"].startswith("https://checkout.paystack.com/")

    # Paystack confirmed it; MSFLib's verify route then fires our listener (ADR 0019).
    payment = marketplace.exec(
        select(models.Payment).where(models.Payment.reference == reference)
    ).one()
    payment.status = models.PaymentStatus.verified
    marketplace.add(payment)
    marketplace.commit()
    r = client.get(f"{API}/payments/verify/{reference}", headers=headers)
    assert r.status_code == 200, r.text

    detail = client.get(f"{API}/bookings/{booking['id']}", headers=headers).json()
    assert detail["status"] == "paid"
    assert detail["payment"]["reference"] == reference
    assert [e["to_status"] for e in detail["events"]] == ["requested", "accepted", "paid"]
    assert "Booking paid" in _titles(marketplace, "sparkle@example.com")

    # Second verify is a no-op, not an error.
    assert client.get(f"{API}/payments/verify/{reference}", headers=headers).status_code == 200


def test_review_rules(client, marketplace, login, deep_clean) -> None:
    headers = login("temi@example.com")
    booking = _request(client, headers, deep_clean.id).json()
    review_url = f"{API}/bookings/{booking['id']}/review"
    assert client.post(review_url, json={"rating": 5}, headers=headers).status_code == 409

    # Drive it to completed through the service, as the provider and Paystack would.
    row = marketplace.get(models.Booking, booking["id"])
    for to_status, role in [
        ("accepted", "provider"),
        ("paid", "customer"),
        ("completed", "provider"),
    ]:
        booking_service.BookingService.transition(
            marketplace, row, to_status, actor_role=role, actor_account_id=None
        )
    marketplace.commit()

    assert client.post(review_url, json={"rating": 6}, headers=headers).status_code == 422
    other = login("david@example.com")
    assert client.post(review_url, json={"rating": 5}, headers=other).status_code == 403

    r = client.post(review_url, json={"rating": 3, "comment": "Fine."}, headers=headers)
    assert r.status_code == 201, r.text
    assert r.json()["customer_name"] == "Temi B."
    assert client.post(review_url, json={"rating": 5}, headers=headers).status_code == 409

    listing = client.get(f"{API}/listings/{deep_clean.id}").json()
    assert listing["rating_count"] == 3
    assert listing["rating_avg"] == round((5 + 5 + 3) / 3, 1)
    assert "New review" in _titles(marketplace, "sparkle@example.com")
