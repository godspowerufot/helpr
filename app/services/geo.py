"""Service region and distance helpers (ADR 0022). No PostGIS: box filter in SQL, exact
distance in Python."""

from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException

from app.core.config import settings
from app.schemas.geo import MapBounds, MapConfig

EARTH_RADIUS_KM = 6371.0088
KM_PER_DEGREE_LAT = 111.32


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * asin(sqrt(a))


def bounding_box(lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    """(south, west, north, east) of a square that contains the radius circle."""
    dlat = radius_km / KM_PER_DEGREE_LAT
    dlng = radius_km / (KM_PER_DEGREE_LAT * max(cos(radians(lat)), 1e-6))
    return lat - dlat, lng - dlng, lat + dlat, lng + dlng


def in_service_region(lat: float, lng: float) -> bool:
    return (
        settings.MAP_BOUNDS_SOUTH <= lat <= settings.MAP_BOUNDS_NORTH
        and settings.MAP_BOUNDS_WEST <= lng <= settings.MAP_BOUNDS_EAST
    )


def outside_region_error() -> HTTPException:
    return HTTPException(
        status_code=422,
        detail=f"Helpr is only available in {settings.SERVICE_REGION_NAME} for now.",
    )


def require_point(lat: float | None, lng: float | None) -> tuple[float, float] | None:
    """Both or neither; a given point must be inside the service region."""
    if lat is None and lng is None:
        return None
    if lat is None or lng is None:
        raise HTTPException(status_code=422, detail="Send both latitude and longitude.")
    if not in_service_region(lat, lng):
        raise outside_region_error()
    return lat, lng


def clamp_radius(radius_km: float | None) -> float:
    return min(radius_km or settings.NEARBY_DEFAULT_RADIUS_KM, settings.NEARBY_MAX_RADIUS_KM)


def map_config() -> MapConfig:
    return MapConfig(
        region_name=settings.SERVICE_REGION_NAME,
        center_lat=settings.MAP_CENTER_LAT,
        center_lng=settings.MAP_CENTER_LNG,
        bounds=MapBounds(
            south=settings.MAP_BOUNDS_SOUTH,
            west=settings.MAP_BOUNDS_WEST,
            north=settings.MAP_BOUNDS_NORTH,
            east=settings.MAP_BOUNDS_EAST,
        ),
        min_zoom=settings.MAP_MIN_ZOOM,
        max_zoom=settings.MAP_MAX_ZOOM,
        default_zoom=settings.MAP_DEFAULT_ZOOM,
        zoom_snap=settings.MAP_ZOOM_SNAP,
        wheel_px_per_zoom_level=settings.MAP_WHEEL_PX_PER_ZOOM_LEVEL,
        tile_url=settings.MAP_TILE_URL,
        tile_attribution=settings.MAP_TILE_ATTRIBUTION,
        default_radius_km=settings.NEARBY_DEFAULT_RADIUS_KM,
        max_radius_km=settings.NEARBY_MAX_RADIUS_KM,
    )
