from datetime import UTC, datetime, timedelta

import pytest
from sqlmodel import Session, select

from app import models
from app.actions import user_action, workspace_action
from app.core.config import settings

API = settings.API_V1_STR
SPARKLE = "sparkle-home"


def _open_booking(session: Session, title: str, status: str) -> models.Booking:
    return session.exec(
        select(models.Booking)
        .join(models.Listing, models.Listing.id == models.Booking.listing_id)
        .where(models.Listing.title == title, models.Booking.status == status)
    ).one()


# --- onboarding (ADR 0005 validation step 1) --------------------------------------------


def test_become_a_provider(client, marketplace, login) -> None:
    headers = login("ngozi@example.com")
    body = {
        "display_name": "Ngozi Laundry Eket",
        "bio": "Wash, dry and fold.",
        "service_area": "Eket Town",
        "phone": "+2348030000099",
        "latitude": 4.645,
        "longitude": 7.92,
    }
    r = client.post(f"{API}/providers", json=body, headers=headers)
    assert r.status_code == 201, r.text
    provider = r.json()
    assert provider["workspace_slug"] == "ngozi-laundry-eket"
    assert provider["stats"] == {
        "published_listing_count": 0,
        "open_booking_count": 0,
        "completed_booking_count": 0,
    }

    workspace = workspace_action.get_by_all(marketplace, slug="ngozi-laundry-eket")
    membership = user_action.get_by_all(
        marketplace, account_id=workspace.owner_id, workspace_id=workspace.id
    )
    assert membership.type == models.UserType.owner

    mine = client.get(f"{API}/providers/mine", headers=headers).json()
    assert [p["workspace_slug"] for p in mine] == ["ngozi-laundry-eket"]
    assert client.get(f"{API}/ngozi-laundry-eket/provider", headers=headers).status_code == 200

    assert client.post(f"{API}/providers", json=body, headers=headers).status_code == 409
    outside = {**body, "display_name": "Lagos Laundry", "latitude": 6.45, "longitude": 3.47}
    assert client.post(f"{API}/providers", json=outside, headers=headers).status_code == 422
    reserved = {**body, "display_name": "Listings"}
    assert client.post(f"{API}/providers", json=reserved, headers=headers).status_code == 422
    assert client.post(f"{API}/providers", json=body).status_code == 401


# --- isolation (ADR 0005 validation steps 2-4) ------------------------------------------


@pytest.mark.parametrize("path", ["", "/listings", "/bookings", "/earnings"])
def test_provider_routes_are_isolated(client, marketplace, login, path) -> None:
    assert (
        client.get(
            f"{API}/{SPARKLE}/provider{path}", headers=login("sparkle@example.com")
        ).status_code
        == 200
    )
    other_provider = login("tunde@example.com")
    assert client.get(f"{API}/{SPARKLE}/provider{path}", headers=other_provider).status_code == 403
    customer = login("temi@example.com")
    assert client.get(f"{API}/{SPARKLE}/provider{path}", headers=customer).status_code == 403
    assert client.get(f"{API}/{SPARKLE}/provider{path}").status_code == 401
    assert client.get(f"{API}/default/provider{path}", headers=customer).status_code == 404
    assert client.get(f"{API}/nope/provider{path}", headers=customer).status_code == 404


def test_another_providers_rows_are_not_found(client, marketplace, login) -> None:
    headers = login("sparkle@example.com")
    tunde_listing = marketplace.exec(
        select(models.Listing).where(models.Listing.title == "Leak Repair and Call-Out")
    ).one()
    tunde_booking = _open_booking(marketplace, "Leak Repair and Call-Out", "accepted")
    base = f"{API}/{SPARKLE}/provider"
    assert (
        client.patch(
            f"{base}/listings/{tunde_listing.id}", json={"title": "Mine now"}, headers=headers
        ).status_code
        == 404
    )
    assert client.get(f"{base}/bookings/{tunde_booking.id}", headers=headers).status_code == 404
    assert (
        client.post(
            f"{base}/bookings/{tunde_booking.id}/cancel", json={"reason": "x"}, headers=headers
        ).status_code
        == 404
    )


# --- profile and listings (P2) ----------------------------------------------------------


def test_profile_and_listing_management(client, marketplace, login) -> None:
    headers = login("sparkle@example.com")
    base = f"{API}/{SPARKLE}/provider"

    me = client.get(base, headers=headers).json()
    assert me["stats"]["published_listing_count"] == 2
    assert me["stats"]["open_booking_count"] == 2
    assert me["phone"] == "+2348031234501"
    moved = client.patch(base, json={"latitude": 4.65, "longitude": 7.93}, headers=headers)
    assert moved.json()["latitude"] == 4.65
    assert (
        client.patch(base, json={"latitude": 6.45, "longitude": 3.47}, headers=headers).status_code
        == 422
    )

    statuses = {item["status"] for item in client.get(f"{base}/listings", headers=headers).json()}
    assert statuses == {"published", "draft"}

    body = {
        "category_slug": "cleaning",
        "title": "Sofa Shampoo",
        "description": "Three-seater sofa shampooed and dried on site.",
        "pricing_type": "fixed",
        "price_amount": 1200000,
        "duration_minutes": 120,
        "service_area": "Eket Town",
    }
    created = client.post(f"{base}/listings", json=body, headers=headers)
    assert created.status_code == 201, created.text
    listing = created.json()
    assert listing["status"] == "draft"
    assert client.get(f"{API}/listings/{listing['id']}").status_code == 404

    bad = client.post(
        f"{base}/listings", json={**body, "category_slug": "cooking"}, headers=headers
    )
    assert bad.status_code == 422
    assert (
        client.post(
            f"{base}/listings", json={**body, "price_amount": 0}, headers=headers
        ).status_code
        == 422
    )

    edited = client.patch(
        f"{base}/listings/{listing['id']}", json={"price_amount": 1500000}, headers=headers
    )
    assert edited.json()["price_amount"] == 1500000

    assert (
        client.post(f"{base}/listings/{listing['id']}/publish", headers=headers).json()["status"]
        == "published"
    )
    assert (
        client.post(f"{base}/listings/{listing['id']}/publish", headers=headers).status_code == 409
    )
    assert client.get(f"{API}/listings/{listing['id']}").status_code == 200
    assert (
        client.post(f"{base}/listings/{listing['id']}/archive", headers=headers).json()["status"]
        == "archived"
    )
    assert client.get(f"{API}/listings/{listing['id']}").status_code == 404


# --- incoming bookings (P3-P5) ----------------------------------------------------------


def test_incoming_bookings_and_actions(client, marketplace, login) -> None:
    headers = login("sparkle@example.com")
    base = f"{API}/{SPARKLE}/provider/bookings"

    requested = client.get(base, params={"status": "requested"}, headers=headers).json()
    assert len(requested) == 2
    assert {b["customer_name"] for b in requested} == {"Bola S.", "Halima Y."}
    first, second = requested

    detail = client.get(f"{base}/{first['id']}", headers=headers).json()
    assert detail["latitude"] is not None
    assert detail["distance_km"] is not None

    assert client.post(f"{base}/{first['id']}/complete", headers=headers).status_code == 409
    accepted = client.post(f"{base}/{first['id']}/accept", headers=headers)
    assert accepted.json()["status"] == "accepted"
    assert client.post(f"{base}/{first['id']}/accept", headers=headers).status_code == 409
    assert client.post(f"{base}/{first['id']}/cancel", json={}, headers=headers).status_code == 422
    cancelled = client.post(
        f"{base}/{first['id']}/cancel", json={"reason": "Van broke down"}, headers=headers
    )
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["events"][-1]["actor_role"] == "provider"

    declined = client.post(f"{base}/{second['id']}/decline", json={}, headers=headers)
    assert declined.json()["status"] == "declined"
    assert client.post(f"{base}/{second['id']}/frobnicate", headers=headers).status_code == 422


def test_complete_a_paid_booking_and_earnings(client, marketplace, login) -> None:
    headers = login("brightwire@example.com")
    base = f"{API}/brightwire-electric/provider"

    before = client.get(f"{base}/earnings", headers=headers).json()
    assert before["completed_count"] == 2
    assert before["total_amount"] == 4500000 + 800000
    assert before["pending_amount"] == 4500000
    assert before["currency"] == "NGN"

    paid = _open_booking(marketplace, "Inverter and Battery Installation", "paid")
    r = client.post(f"{base}/bookings/{paid.id}/complete", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "completed"

    after = client.get(f"{base}/earnings", headers=headers).json()
    assert after["completed_count"] == 3
    assert after["pending_amount"] == 0
    assert after["recent"][0]["booking_id"] == paid.id


def test_scheduled_for_in_the_past_is_still_shown(client, marketplace, login) -> None:
    """Old completed bookings stay in the provider inbox history."""
    headers = login("sparkle@example.com")
    completed = client.get(
        f"{API}/{SPARKLE}/provider/bookings", params={"status": "completed"}, headers=headers
    ).json()
    assert len(completed) == 3
    assert all(
        datetime.fromisoformat(b["scheduled_for"])
        < datetime.now(UTC).replace(tzinfo=None) + timedelta(days=1)
        for b in completed
    )
