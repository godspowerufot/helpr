from fastapi import APIRouter

from app.schemas.geo import MapConfig
from app.services import geo

router = APIRouter()


@router.get("/config", response_model=MapConfig)
def read_map_config() -> MapConfig:
    """Public. The service region (Eket), its bounds, zoom limits, wheel-zoom tuning and tile
    source; the frontend map reads everything from here (ADR 0022)."""
    return geo.map_config()
