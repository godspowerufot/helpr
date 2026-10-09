import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from msflib.eventbus import use_app_emitter
from msflib.seed.base import SeederBase
from msflib.seed.schema import ConfigSchema
from sqlalchemy import func
from sqlmodel import Session, select

from app import models
from app.actions import (
    account_action,
    profile_action,
    tenant_action,
    user_action,
    workspace_action,
)
from app.core.config import settings
from app.services.marketplace import customer_display_name
from app.services.notification import (
    activity_href,
    link_unlinked_notifications,
    notify_accounts,
    provider_managers,
    with_link,
)

logger = logging.getLogger(__name__)

S = models.BookingStatus
R = models.BookingActorRole

# Event trail that reaches each status, with the actor of each step (ADR 0007).
_PATH = [
    (None, S.requested, R.customer),
    (S.requested, S.accepted, R.provider),
    (S.accepted, S.paid, R.customer),
    (S.paid, S.completed, R.provider),
]
_STEPS = {S.requested: 1, S.accepted: 2, S.paid: 3, S.completed: 4}


class MarketplaceSeeder(SeederBase):
    """Demo marketplace: categories, provider workspaces with listings, customers, and
    completed bookings with reviews. Safe to rerun; existing rows are left alone.

    Historical bookings are fixtures written with their full event trail; live bookings
    change status only through `BookingService.transition()` (ADR 0007).
    """

    def __init__(self, config: ConfigSchema) -> None:
        self.config = config
        self.data: dict[str, Any] = config.records[0] if config.records else {}

    def seed(self, session: Session, seeds: dict[str, Any]) -> None:
        from app.main import app

        password = self.data.get("password") or ""
        if not password or password.startswith("${"):
            raise ValueError("Set SEED_ACCOUNT_PASSWORD in backend/.env before seeding.")

        with use_app_emitter(app):
            tenant = tenant_action.ensure_default_tenant(
                session, settings=settings.scope("TENANCY")
            )
            categories = self._categories(session)
            customers = {
                c["email"]: self._account(session, c, password) for c in self.data["customers"]
            }
            listings: dict[str, models.Listing] = {}
            for provider in self.data["providers"]:
                listings.update(self._provider(session, provider, password, tenant, categories))
            session.flush()
            completed = []
            for record in self.data.get("completed_bookings", []):
                listing = listings.get(record["listing"])
                if listing is not None:
                    booking = self._booking(session, record, listing, customers, S.completed)
                    completed.append((record, listing, customers[record["customer"]], booking))
            opened = []
            for record in self.data.get("open_bookings", []):
                listing = listings.get(record["listing"])
                if listing is not None:
                    booking = self._booking(session, record, listing, customers, record["status"])
                    opened.append((booking, listing))
            session.flush()
            self._refresh_ratings(session)
            session.commit()

            for record, listing, customer, booking in completed:
                self._notify_completed(session, record, listing, customer, booking)
            for booking, listing in opened:
                self._notify_open(session, booking, listing)
            linked = link_unlinked_notifications(session)
            if linked:
                logger.info("Attached destinations to %s existing notifications", linked)

        seeds.update({self.config.name: list(listings.values())})

    def _notify_completed(
        self,
        session: Session,
        record: dict,
        listing: models.Listing,
        customer: models.Account,
        booking: models.Booking,
    ) -> None:
        provider = session.exec(
            select(models.ProviderProfile).where(
                models.ProviderProfile.workspace_id == listing.provider_workspace_id
            )
        ).one()
        workspace = session.get(models.Workspace, listing.provider_workspace_id)
        notify_accounts(
            session,
            [customer],
            "Job completed. Leave a review",
            with_link(
                f"{provider.display_name} marked “{listing.title}” as completed.",
                activity_href(booking.id),
            ),
        )
        reviewer = customer_display_name(customer, profile_action.get(session, id=customer.id))
        notify_accounts(
            session,
            provider_managers(session, listing.provider_workspace_id),
            "New review",
            with_link(
                f"{reviewer} rated “{listing.title}” {record['rating']}/5.",
                activity_href(booking.id, workspace_slug=workspace.slug),
            ),
        )

    def _categories(self, session: Session) -> dict[str, models.Category]:
        result = {}
        for record in self.data["categories"]:
            category = session.exec(
                select(models.Category).where(models.Category.slug == record["slug"])
            ).first()
            if category is None:
                category = models.Category(**record)
                session.add(category)
            result[record["slug"]] = category
        session.flush()
        return result

    def _account(self, session: Session, record: dict, password: str) -> models.Account:
        account = account_action.get_by_email(session, email=record["email"])
        if account is None:
            account = account_action.create(
                session,
                data=models.AccountCreate(
                    username=record["username"],
                    email=record["email"],
                    phone=record.get("phone", ""),
                    password=password,
                    status=models.AccountStatus.active,
                    role=models.AccountRole.user,
                ),
            )
        if profile_action.get(session, id=account.id) is None:
            profile_action.create(
                session,
                data=models.ProfileCreate(
                    first_name=record["first_name"], last_name=record["last_name"]
                ),
                update={"id": account.id},
            )
        return account

    def _provider(
        self,
        session: Session,
        record: dict,
        password: str,
        tenant: models.Tenant,
        categories: dict[str, models.Category],
    ) -> dict[str, models.Listing]:
        workspace = workspace_action.get_by_all(session, slug=record["slug"])
        if workspace is not None:
            logger.info("Provider %s exists; skipping", record["slug"])
            return {}

        owner = self._account(session, {**record["owner"], "phone": record["phone"]}, password)
        workspace = workspace_action.create_with_owner(
            session,
            data=models.WorkspaceCreate(
                name=record["display_name"],
                slug=record["slug"],
                description=record["bio"],
                owner_id=owner.id,
                status="open",
            ),
            owner=owner,
            tenant=tenant,
        )
        user_action.create_membership(
            session,
            account_id=owner.id,
            workspace_id=workspace.id,
            owner_id=workspace.owner_id,
            commit=False,
        )
        session.add(
            models.ProviderProfile(
                workspace_id=workspace.id,
                display_name=record["display_name"],
                bio=record["bio"],
                service_area=record["service_area"],
                phone=record["phone"],
                latitude=record.get("latitude"),
                longitude=record.get("longitude"),
            )
        )

        listings = {}
        for item in record["listings"]:
            fields = {k: v for k, v in item.items() if k not in {"key", "category"}}
            listing = models.Listing(
                provider_workspace_id=workspace.id,
                category_id=categories[item["category"]].id,
                currency="NGN",
                **fields,
            )
            session.add(listing)
            listings[item["key"]] = listing
        return listings

    def _booking(
        self,
        session: Session,
        record: dict,
        listing: models.Listing,
        customers: dict[str, models.Account],
        status: str,
    ) -> models.Booking:
        """A booking with the full event trail up to `status`; paid and completed ones get a
        verified Paystack payment row, as `GET /payments/verify` would have left it. Fixture
        data only: live bookings move through `BookingService.transition()`."""
        status = S(status)
        customer = customers[record["customer"]]
        scheduled_for = datetime.fromisoformat(record["scheduled_for"].replace("Z", "+00:00"))
        scheduled_for = scheduled_for.replace(tzinfo=None)
        steps = _PATH[: _STEPS[status]]
        if status == S.completed:
            start = scheduled_for - timedelta(days=4)
            times = [start, start + timedelta(hours=1), start + timedelta(hours=2)]
            times.append(scheduled_for + timedelta(hours=6))
        else:
            now = datetime.now(UTC).replace(tzinfo=None)
            times = [now - timedelta(hours=6 - 2 * i) for i in range(len(steps))]

        booking = models.Booking(
            listing_id=listing.id,
            provider_workspace_id=listing.provider_workspace_id,
            customer_account_id=customer.id,
            status=status,
            scheduled_for=scheduled_for,
            address=record["address"],
            notes=record.get("notes", ""),
            latitude=record.get("latitude"),
            longitude=record.get("longitude"),
            price_amount=listing.price_amount,
            currency=listing.currency,
            created_at=times[0],
            updated_at=times[-1],
        )
        session.add(booking)
        session.flush()
        for (from_status, to_status, role), at in zip(steps, times, strict=True):
            session.add(
                models.BookingEvent(
                    booking_id=booking.id,
                    from_status=from_status,
                    to_status=to_status,
                    actor_role=role,
                    actor_account_id=customer.id if role == R.customer else None,
                    created_at=at,
                )
            )
        if status in (S.paid, S.completed):
            payment = models.Payment(
                account_id=customer.id,
                email=customer.email,
                description=f"Helpr booking #{booking.id}: {listing.title}",
                amount=booking.price_amount / 100,
                callback_url=None,
                data={"seeded": True, "booking_id": booking.id, "currency": booking.currency},
                authorization_url="https://checkout.paystack.com/seeded",
                access_code=None,
                reference=f"HELPR-SEED-{booking.id}",
                status=models.PaymentStatus.verified,
                gateway="paystack",
                created_at=times[2],
                updated_at=times[2],
            )
            session.add(payment)
            session.flush()
            booking.payment_id = payment.id
        if status == S.completed:
            session.add(
                models.Review(
                    booking_id=booking.id,
                    listing_id=listing.id,
                    provider_workspace_id=listing.provider_workspace_id,
                    customer_account_id=customer.id,
                    rating=record["rating"],
                    comment=record["comment"],
                    created_at=scheduled_for + timedelta(days=1),
                )
            )
        return booking

    def _notify_open(
        self, session: Session, booking: models.Booking, listing: models.Listing
    ) -> None:
        customer = account_action.get(session, id=booking.customer_account_id)
        name = customer_display_name(customer, profile_action.get(session, id=customer.id))
        managers = provider_managers(session, listing.provider_workspace_id)
        workspace = session.get(models.Workspace, listing.provider_workspace_id)
        provider_href = activity_href(booking.id, workspace_slug=workspace.slug)
        if booking.status == S.requested:
            notify_accounts(
                session,
                managers,
                "New booking request",
                with_link(
                    f"{name} requested “{listing.title}” for "
                    f"{booking.scheduled_for:%a %d %b, %H:%M}.",
                    provider_href,
                ),
            )
        elif booking.status == S.accepted:
            notify_accounts(
                session,
                [customer],
                "Booking accepted. Pay to confirm",
                with_link(
                    f"Your booking for “{listing.title}” was accepted.",
                    activity_href(booking.id),
                ),
            )
        elif booking.status == S.paid:
            notify_accounts(
                session,
                managers,
                "Booking paid",
                with_link(
                    f"Booking #{booking.id} was paid through Paystack. You can do the job.",
                    provider_href,
                ),
            )

    def _refresh_ratings(self, session: Session) -> None:
        def stats(column):
            return {
                key: (round(float(avg), 1), int(count))
                for key, avg, count in session.exec(
                    select(column, func.avg(models.Review.rating), func.count()).group_by(column)
                ).all()
            }

        by_listing = stats(models.Review.listing_id)
        by_provider = stats(models.Review.provider_workspace_id)
        for listing in session.exec(select(models.Listing)).all():
            listing.rating_avg, listing.rating_count = by_listing.get(listing.id, (0, 0))
            session.add(listing)
        for provider in session.exec(select(models.ProviderProfile)).all():
            provider.rating_avg, provider.rating_count = by_provider.get(
                provider.workspace_id, (0, 0)
            )
            session.add(provider)
