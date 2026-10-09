from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import models
from app.actions import account_action, workspace_action
from app.core.config import settings
from app.services.notification import (
    link_unlinked_notifications,
    notify_accounts,
    provider_managers,
)

API = settings.API_V1_STR


def _me(session: Session) -> models.Account:
    return account_action.get_by_email(session, email=settings.EMAIL_TEST_ACCOUNT)


def test_inbox_requires_login(client: TestClient) -> None:
    assert client.get(f"{API}/notifications/").status_code == 401
    assert client.patch(f"{API}/notifications/mark-all").status_code == 401


def test_notify_reaches_only_the_receiver(
    client: TestClient, session: Session, normal_account_token_headers: dict[str, str]
) -> None:
    other = account_action.create(session, data=account_action.random())
    notify_accounts(session, [_me(session)], "Booking accepted", "Pay to confirm.")
    notify_accounts(session, [other], "Not for you", "Someone else's booking.")

    inbox = client.get(f"{API}/notifications/", headers=normal_account_token_headers).json()
    assert [n["notification"]["title"] for n in inbox] == ["Booking accepted"]
    assert inbox[0]["is_read"] is False
    assert inbox[0]["notification"]["channels"] == ["inapp"]

    theirs = session.exec(
        select(models.AccountNotification).where(models.AccountNotification.receiver_id == other.id)
    ).one()
    r = client.get(f"{API}/notifications/{theirs.id}", headers=normal_account_token_headers)
    assert r.status_code == 404


def test_mark_one_and_mark_all(
    client: TestClient, session: Session, normal_account_token_headers: dict[str, str]
) -> None:
    me = _me(session)
    notify_accounts(session, [me], "One", "First.")
    notify_accounts(session, [me], "Two", "Second.")
    inbox = client.get(f"{API}/notifications/", headers=normal_account_token_headers).json()

    r = client.patch(
        f"{API}/notifications/{inbox[0]['id']}/mark",
        params={"status": True},
        headers=normal_account_token_headers,
    )
    assert r.json()["is_read"] is True

    r = client.patch(
        f"{API}/notifications/mark-all",
        params={"status": True},
        headers=normal_account_token_headers,
    )
    assert all(n["is_read"] for n in r.json())


def test_notify_with_no_receivers_stores_nothing(session: Session) -> None:
    assert notify_accounts(session, [], "Nobody", "No one to tell.") is None
    assert session.exec(select(models.Notification)).first() is None


def test_provider_managers_are_the_workspace_owner(marketplace: Session) -> None:
    workspace = workspace_action.get_by_all(marketplace, slug="sparkle-home")
    managers = provider_managers(marketplace, workspace.id)
    assert [a.email for a in managers] == ["sparkle@example.com"]


def test_seeded_bookings_notify_customer_and_provider(marketplace: Session) -> None:
    def titles(email: str) -> list[str]:
        account = account_action.get_by_email(marketplace, email=email)
        return [
            n.title
            for n in marketplace.exec(
                select(models.Notification)
                .join(models.AccountNotification)
                .where(models.AccountNotification.receiver_id == account.id)
            ).all()
        ]

    assert sorted(titles("chiamaka@example.com")) == [
        "Booking accepted. Pay to confirm",
        "Job completed. Leave a review",
        "Job completed. Leave a review",
    ]
    assert sorted(titles("sparkle@example.com")) == ["New booking request"] * 2 + ["New review"] * 3
    assert titles("brightwire@example.com").count("Booking paid") == 1


def _messages(session: Session, email: str) -> list[str]:
    account = account_action.get_by_email(session, email=email)
    return [
        n.message
        for n in session.exec(
            select(models.Notification)
            .join(models.AccountNotification)
            .where(models.AccountNotification.receiver_id == account.id)
        ).all()
    ]


def test_seeded_notifications_open_the_booking(marketplace: Session) -> None:
    customer = _messages(marketplace, "chiamaka@example.com")
    assert any("[[helpr:/bookings/view?id=" in message for message in customer)
    assert any(
        "[[helpr:/provider/bookings/view?id=" in message and "workspace=sparkle-home" in message
        for message in _messages(marketplace, "sparkle@example.com")
    )


def test_unlinked_notification_gains_its_booking_path(marketplace: Session) -> None:
    booking = marketplace.exec(
        select(models.Booking).where(models.Booking.status == models.BookingStatus.paid)
    ).first()
    assert booking is not None
    managers = provider_managers(marketplace, booking.provider_workspace_id)
    notify_accounts(
        marketplace,
        managers,
        "Booking paid",
        f"Booking #{booking.id} was paid through Paystack. You can do the job.",
    )
    assert link_unlinked_notifications(marketplace) == 1
    workspace = workspace_action.get_by_all(marketplace, id=booking.provider_workspace_id)
    assert any(
        f"[[helpr:/provider/bookings/view?id={booking.id}&workspace={workspace.slug}]]" in message
        for message in _messages(marketplace, managers[0].email)
    )
