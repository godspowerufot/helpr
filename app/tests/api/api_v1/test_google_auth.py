from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.actions import account_action
from app.core.config import settings

CALLBACK = f"{settings.API_V1_STR}/google/callback"


@pytest.fixture
def google_enabled(monkeypatch):
    auth = settings.scope("AUTH")
    monkeypatch.setattr(auth, "ENABLE_GOOGLE_OAUTH", True)
    monkeypatch.setattr(auth, "ALLOW_GOOGLE_OAUTH_SIGNUP", True)
    monkeypatch.setattr(auth, "GOOGLE_REDIRECT_URI", "http://localhost:3000/login")


def _google_user(email: str):
    response = MagicMock()
    response.json.return_value = {"email": email, "given_name": "Ada", "family_name": "Obi"}
    response.raise_for_status = MagicMock()
    return patch.multiple(
        "msflib.auth.router.AsyncOAuth2Client",
        fetch_token=AsyncMock(return_value={"access_token": "x"}),
        get=AsyncMock(return_value=response),
    )


def test_google_callback_creates_account_then_reuses_it(
    client: TestClient, session: Session, google_enabled
) -> None:
    email = "Google.Person@example.com"
    with _google_user(email):
        first = client.post(CALLBACK, json={"code": "abc"})
        second = client.post(CALLBACK, json={"code": "def"})

    assert first.status_code == 200, first.text
    assert first.json()["access_token"]
    assert second.status_code == 200, second.text

    account = account_action.get_by_email(session, email=email)
    assert account is not None
    assert first.json()["account"]["id"] == second.json()["account"]["id"] == account.id


def test_google_callback_disabled_returns_403(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(settings.scope("AUTH"), "ENABLE_GOOGLE_OAUTH", False)
    response = client.post(CALLBACK, json={"code": "abc"})
    assert response.status_code == 403
