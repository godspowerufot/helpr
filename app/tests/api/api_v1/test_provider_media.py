"""Provider photos (ADR 0027) and blocked days (ADR 0028)."""

from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from sqlmodel import Session, select

from app import models
from app.actions import user_action, workspace_action
from app.core.config import settings
from app.services import availability
from app.services.provider_photo import MAX_WORK_PHOTOS

API = settings.API_V1_STR
SPARKLE = "sparkle-home"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture(autouse=True)
def storage_root(tmp_path, monkeypatch) -> Path:
    """Local storage writes under the working directory (`msflib-facts` "File uploads")."""
    monkeypatch.chdir(tmp_path)
    return tmp_path / settings.STORAGE_PATH


def _file(content: bytes = PNG, name: str = "me.png", content_type: str = "image/png"):
    return {"file": (name, content, content_type)}


def _stored(root: Path, url: str) -> Path:
    return root / url.removeprefix(f"{settings.STORAGE_BASE_URL}/")


def _make_admin(session: Session, email: str) -> None:
    workspace = workspace_action.get_by_all(session, slug=SPARKLE)
    account = session.exec(select(models.Account).where(models.Account.email == email)).one()
    user_action.create_membership(
        session,
        account_id=account.id,
        workspace_id=workspace.id,
        owner_id=workspace.owner_id,
        membership_type=models.UserType.admin,
    )


# --- photos -------------------------------------------------------------------------------


def test_profile_photo_upload_replace_and_remove(client, marketplace, login, storage_root):
    headers = login("sparkle@example.com")
    r = client.post(f"{API}/{SPARKLE}/provider/photo", files=_file(), headers=headers)
    assert r.status_code == 200, r.text
    first = r.json()["photo_url"]
    assert first.startswith(f"{settings.STORAGE_BASE_URL}/images/providers/")
    assert first.endswith(".png") and "me.png" not in first
    assert _stored(storage_root, first).read_bytes() == PNG

    r = client.post(
        f"{API}/{SPARKLE}/provider/photo",
        files=_file(JPEG, "new.jpg", "image/jpeg"),
        headers=headers,
    )
    second = r.json()["photo_url"]
    assert second.endswith(".jpg")
    assert not _stored(storage_root, first).exists()
    assert client.get(f"{API}/providers/{SPARKLE}").json()["photo_url"] == second

    r = client.delete(f"{API}/{SPARKLE}/provider/photo", headers=headers)
    assert r.status_code == 200 and r.json()["photo_url"] is None
    assert not _stored(storage_root, second).exists()
    assert client.delete(f"{API}/{SPARKLE}/provider/photo", headers=headers).status_code == 404


def test_upload_rules(client, marketplace, login, monkeypatch):
    headers = login("sparkle@example.com")
    url = f"{API}/{SPARKLE}/provider/photo"
    gif = _file(b"GIF89a" + b"\x00" * 32, "a.gif", "image/gif")
    assert client.post(url, files=gif, headers=headers).status_code == 415
    lying = _file(b"<svg xmlns='http://www.w3.org/2000/svg'/>", "a.png", "image/png")
    assert client.post(url, files=lying, headers=headers).status_code == 415
    monkeypatch.setattr("app.services.provider_photo.MAX_BYTES", 32)
    assert client.post(url, files=_file(), headers=headers).status_code == 413


def test_work_photos(client, marketplace, login, storage_root):
    headers = login("sparkle@example.com")
    url = f"{API}/{SPARKLE}/provider/photos"
    r = client.post(url, files=_file(), data={"caption": "Kitchen after"}, headers=headers)
    assert r.status_code == 201, r.text
    photo = r.json()
    assert photo["caption"] == "Kitchen after"

    detail = client.get(f"{API}/providers/{SPARKLE}").json()
    assert [p["id"] for p in detail["photos"]] == [photo["id"]]
    mine = client.get(f"{API}/{SPARKLE}/provider", headers=headers).json()
    assert [p["caption"] for p in mine["photos"]] == ["Kitchen after"]

    for _ in range(MAX_WORK_PHOTOS - 1):
        assert client.post(url, files=_file(), headers=headers).status_code == 201
    assert client.post(url, files=_file(), headers=headers).status_code == 409

    other = login("tunde@example.com")
    tunde = client.get(f"{API}/providers/mine", headers=other).json()[0]["workspace_slug"]
    assert (
        client.delete(f"{API}/{tunde}/provider/photos/{photo['id']}", headers=other).status_code
        == 404
    )

    r = client.delete(f"{url}/{photo['id']}", headers=headers)
    assert r.status_code == 200
    assert photo["id"] not in [p["id"] for p in r.json()["photos"]]
    assert not _stored(storage_root, photo["url"]).exists()
    assert client.delete(f"{url}/{photo['id']}", headers=headers).status_code == 404


@pytest.mark.parametrize("path", ["/photo", "/photos"])
def test_photo_routes_are_isolated(client, marketplace, login, path):
    url = f"{API}/{SPARKLE}/provider{path}"
    assert client.post(url, files=_file(), headers=login("tunde@example.com")).status_code == 403
    assert client.post(url, files=_file(), headers=login("temi@example.com")).status_code == 403
    assert client.post(url, files=_file()).status_code == 401
    _make_admin(marketplace, "ngozi@example.com")
    ok = client.post(url, files=_file(), headers=login("ngozi@example.com")).status_code
    assert ok in (200, 201)


# --- blocked days ---------------------------------------------------------------------------


def _day(offset: int) -> str:
    return (availability.today() + timedelta(days=offset)).isoformat()


def test_block_and_unblock_days(client, marketplace, login):
    headers = login("sparkle@example.com")
    url = f"{API}/{SPARKLE}/provider/blocked-days"
    r = client.post(url, json={"day": _day(5), "note": "Family event"}, headers=headers)
    assert r.status_code == 201, r.text
    assert client.post(url, json={"day": _day(2)}, headers=headers).status_code == 201
    assert client.post(url, json={"day": _day(5)}, headers=headers).status_code == 409
    assert client.post(url, json={"day": _day(-1)}, headers=headers).status_code == 422

    mine = client.get(url, headers=headers).json()
    assert mine == [{"day": _day(2), "note": ""}, {"day": _day(5), "note": "Family event"}]
    public = client.get(f"{API}/providers/{SPARKLE}/blocked-days")
    assert public.status_code == 200
    assert public.json() == [_day(2), _day(5)]

    r = client.delete(f"{url}/{_day(2)}", headers=headers)
    assert r.status_code == 200
    assert r.json() == [{"day": _day(5), "note": "Family event"}]
    assert client.delete(f"{url}/{_day(2)}", headers=headers).status_code == 404
    assert client.get(f"{API}/providers/{SPARKLE}/blocked-days").json() == [_day(5)]
    assert client.get(f"{API}/providers/default/blocked-days").status_code == 404
    assert client.get(f"{API}/providers/nope/blocked-days").status_code == 404


def test_blocked_day_routes_are_isolated(client, marketplace, login):
    url = f"{API}/{SPARKLE}/provider/blocked-days"
    body = {"day": _day(3)}
    assert client.post(url, json=body, headers=login("tunde@example.com")).status_code == 403
    assert client.post(url, json=body, headers=login("temi@example.com")).status_code == 403
    assert client.post(url, json=body).status_code == 401
    assert client.get(url).status_code == 401
    _make_admin(marketplace, "ngozi@example.com")
    assert client.post(url, json=body, headers=login("ngozi@example.com")).status_code == 201


def test_booking_on_a_blocked_day_is_rejected(client, marketplace, login):
    provider = login("sparkle@example.com")
    blocked = availability.today() + timedelta(days=4)
    client.post(
        f"{API}/{SPARKLE}/provider/blocked-days",
        json={"day": blocked.isoformat()},
        headers=provider,
    )
    listing = marketplace.exec(
        select(models.Listing).where(models.Listing.title == "Deep Clean, 3-Bedroom Apartment")
    ).one()

    def request(local_day, hour: int):
        # Africa/Lagos is UTC+1: local midnight is 23:00 UTC the previous day.
        at = datetime(local_day.year, local_day.month, local_day.day, tzinfo=UTC) + timedelta(
            hours=hour - 1
        )
        return client.post(
            f"{API}/bookings",
            json={"listing_id": listing.id, "scheduled_for": at.isoformat(), "address": "5 Ikot"},
            headers=login("temi@example.com"),
        )

    r = request(blocked, 9)
    assert r.status_code == 409
    assert "not available" in r.json()["detail"]
    assert request(blocked, 0).status_code == 409
    assert request(blocked + timedelta(days=1), 9).status_code == 201
