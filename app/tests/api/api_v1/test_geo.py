from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.services.geo import bounding_box, haversine_km, in_service_region

API = settings.API_V1_STR
EKET = {"lat": 4.6420, "lng": 7.9230}
LAGOS = {"lat": 6.4550, "lng": 3.3941}


def test_haversine_and_box() -> None:
    assert haversine_km(4.6420, 7.9230, 4.6420, 7.9230) == 0
    # One degree of latitude is about 111 km.
    assert 110 < haversine_km(4.0, 7.9, 5.0, 7.9) < 112
    south, west, north, east = bounding_box(4.642, 7.923, 5)
    assert south < 4.642 < north and west < 7.923 < east
    assert in_service_region(4.642, 7.923)
    assert not in_service_region(6.455, 3.394)


def test_map_config_is_public_and_centred_on_eket(client: TestClient) -> None:
    r = client.get(f"{API}/map/config")
    assert r.status_code == 200
    config = r.json()
    assert config["region_name"] == "Eket"
    bounds = config["bounds"]
    assert bounds["south"] < config["center_lat"] < bounds["north"]
    assert bounds["west"] < config["center_lng"] < bounds["east"]
    assert config["min_zoom"] <= config["default_zoom"] <= config["max_zoom"]
    assert config["zoom_snap"] > 0
    assert config["wheel_px_per_zoom_level"] > 0
    assert "openstreetmap" in config["tile_attribution"].lower()


def test_nearby_providers_nearest_first(client: TestClient, marketplace: Session) -> None:
    r = client.get(f"{API}/providers/nearby", params={**EKET, "radius_km": 10})
    assert r.status_code == 200
    pins = r.json()
    assert len(pins) == 12
    distances = [p["distance_km"] for p in pins]
    assert distances == sorted(distances)
    assert all(p["latitude"] and p["longitude"] for p in pins)
    sparkle = next(p for p in pins if p["slug"] == "sparkle-home")
    assert sparkle["listing_count"] == 2
    assert sparkle["categories"] == ["Cleaning"]
    assert [item["title"] for item in sparkle["listings"]] == [
        "Weekly Home Upkeep",
        "Deep Clean, 3-Bedroom Apartment",
    ]
    assert "phone" not in sparkle

    near = client.get(f"{API}/providers/nearby", params={**EKET, "radius_km": 0.8}).json()
    assert 0 < len(near) < 12
    assert all(p["distance_km"] <= 0.8 for p in near)

    plumbing = client.get(
        f"{API}/providers/nearby", params={**EKET, "radius_km": 10, "category": "plumbing"}
    ).json()
    assert [p["slug"] for p in plumbing] == ["tunde-plumbing"]


def test_nearby_rejects_points_outside_eket(client: TestClient, marketplace: Session) -> None:
    r = client.get(f"{API}/providers/nearby", params=LAGOS)
    assert r.status_code == 422
    assert r.json()["detail"] == "Helpr is only available in Eket for now."
    assert client.get(f"{API}/providers/nearby").status_code == 422
    assert client.get(f"{API}/listings", params={"lat": 4.64}).status_code == 422


def test_listings_by_distance(client: TestClient, marketplace: Session) -> None:
    r = client.get(f"{API}/listings", params={**EKET, "radius_km": 10, "limit": 50})
    assert r.status_code == 200
    result = r.json()
    assert result["total"] == 21
    distances = [item["distance_km"] for item in result["items"]]
    assert distances == sorted(distances)

    by_price = client.get(
        f"{API}/listings", params={**EKET, "radius_km": 10, "sort": "price_asc", "limit": 50}
    ).json()["items"]
    prices = [item["price_amount"] for item in by_price]
    assert prices == sorted(prices)
    assert all(item["distance_km"] is not None for item in by_price)

    plain = client.get(f"{API}/listings").json()["items"]
    assert all(item["distance_km"] is None for item in plain)
    assert client.get(f"{API}/listings", params={"sort": "distance"}).status_code == 422

    huge = client.get(f"{API}/listings", params={**EKET, "radius_km": 10_000}).json()
    assert huge["total"] == 21


def test_listing_detail_distance(client: TestClient, marketplace: Session) -> None:
    listing_id = client.get(f"{API}/listings").json()["items"][0]["id"]
    detail = client.get(f"{API}/listings/{listing_id}", params=EKET).json()
    assert detail["distance_km"] is not None
    assert detail["provider"]["latitude"] is not None
