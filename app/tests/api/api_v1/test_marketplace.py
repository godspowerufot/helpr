import json

import pytest
from fastapi.testclient import TestClient
from msflib.seed.schema import ConfigSchema
from sqlmodel import Session, select

from app import models
from app.actions import user_action, workspace_action
from app.core.config import settings
from app.seed.seeders import MarketplaceSeeder
from app.tests.conftest import SEED_FILE

API = settings.API_V1_STR

CARD_KEYS = {
    "id",
    "title",
    "description",
    "pricing_type",
    "price_amount",
    "currency",
    "duration_minutes",
    "service_area",
    "rating_avg",
    "rating_count",
    "category",
    "provider",
    "latitude",
    "longitude",
    "distance_km",
}


def _listing_id(session: Session, title: str) -> int:
    return session.exec(select(models.Listing).where(models.Listing.title == title)).one().id


def test_categories_are_public(client: TestClient, marketplace: Session) -> None:
    r = client.get(f"{API}/categories")
    assert r.status_code == 200
    slugs = [c["slug"] for c in r.json()]
    assert len(slugs) == 12
    assert {"cleaning", "electrical", "private-chef", "domestic-help"} <= set(slugs)
    assert set(r.json()[0]) == {"id", "slug", "name"}


def test_listings_only_published_and_public_fields(
    client: TestClient, marketplace: Session
) -> None:
    r = client.get(f"{API}/listings", params={"limit": 50})
    result = r.json()
    assert r.status_code == 200
    assert result["total"] == 21
    titles = {item["title"] for item in result["items"]}
    assert "Post-Construction Clean" not in titles
    assert "Bridal Makeup Trial" not in titles
    for item in result["items"]:
        assert set(item) == CARD_KEYS
        assert set(item["provider"]) == {"slug", "display_name"}


def test_listings_filters_sort_and_pagination(client: TestClient, marketplace: Session) -> None:
    plumbing = client.get(f"{API}/listings", params={"category": "plumbing"}).json()
    assert plumbing["total"] == 2

    braids = client.get(f"{API}/listings", params={"q": "BRAIDS", "area": "atabong"}).json()
    assert [i["title"] for i in braids["items"]] == ["Knotless Braids at Home"]

    prices = [
        i["price_amount"]
        for i in client.get(f"{API}/listings", params={"sort": "price_asc"}).json()["items"]
    ]
    assert prices == sorted(prices)

    page = client.get(f"{API}/listings", params={"limit": 3, "offset": 20}).json()
    assert page["total"] == 21
    assert len(page["items"]) == 1

    assert client.get(f"{API}/listings", params={"limit": 0}).status_code == 422
    assert client.get(f"{API}/listings", params={"sort": "newest"}).status_code == 422


def test_listing_detail_and_reviews(client: TestClient, marketplace: Session) -> None:
    listing_id = _listing_id(marketplace, "Deep Clean, 3-Bedroom Apartment")

    detail = client.get(f"{API}/listings/{listing_id}").json()
    assert detail["rating_avg"] == 5.0
    assert detail["rating_count"] == 2
    assert set(detail["provider"]) == {
        "slug",
        "display_name",
        "service_area",
        "rating_avg",
        "rating_count",
        "latitude",
        "longitude",
    }

    reviews = client.get(f"{API}/listings/{listing_id}/reviews").json()
    assert reviews["total"] == 2
    assert reviews["items"][0]["customer_name"] == "Ifeoluwa A."
    assert "customer_account_id" not in reviews["items"][0]


@pytest.mark.parametrize("title", ["Post-Construction Clean", "Bridal Makeup Trial"])
def test_unpublished_listing_is_not_found(
    client: TestClient, marketplace: Session, title: str
) -> None:
    listing_id = _listing_id(marketplace, title)
    assert client.get(f"{API}/listings/{listing_id}").status_code == 404
    assert client.get(f"{API}/listings/{listing_id}/reviews").status_code == 404


def test_provider_profile(client: TestClient, marketplace: Session) -> None:
    r = client.get(f"{API}/providers/sparkle-home")
    result = r.json()
    assert r.status_code == 200
    assert result["rating_count"] == 3
    assert [listing["title"] for listing in result["listings"]] == [
        "Weekly Home Upkeep",
        "Deep Clean, 3-Bedroom Apartment",
    ]
    assert "phone" not in result
    assert "workspace_id" not in result
    assert len(result["recent_reviews"]) == 3


def test_workspace_without_provider_profile_is_not_a_provider(
    client: TestClient, marketplace: Session
) -> None:
    default = workspace_action.get_by_all(marketplace, is_default=True)
    assert client.get(f"{API}/providers/{default.slug}").status_code == 404
    assert client.get(f"{API}/providers/nope").status_code == 404


def test_signed_in_customer_reads_the_same(
    client: TestClient, marketplace: Session, normal_account_token_headers: dict[str, str]
) -> None:
    anonymous = client.get(f"{API}/listings").json()
    customer = client.get(f"{API}/listings", headers=normal_account_token_headers)
    assert customer.status_code == 200
    assert customer.json() == anonymous


def test_seeded_provider_owner_has_owner_membership(marketplace: Session) -> None:
    workspace = workspace_action.get_by_all(marketplace, slug="sparkle-home")
    membership = user_action.get_by_all(
        marketplace, account_id=workspace.owner_id, workspace_id=workspace.id
    )
    assert membership is not None
    assert membership.type == models.UserType.owner


def test_seeder_is_idempotent(marketplace: Session) -> None:
    records = json.loads(SEED_FILE.read_text())
    records[0]["password"] = "test-password-123"
    MarketplaceSeeder(
        ConfigSchema(
            name="marketplace",
            seeder_class="app.seed.seeders.MarketplaceSeeder",
            records=records,
        )
    ).seed(marketplace, {})
    assert len(marketplace.exec(select(models.Listing)).all()) == 23
    assert len(marketplace.exec(select(models.Review)).all()) == 16
