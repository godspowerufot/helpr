from pydantic import BaseModel


class MapBounds(BaseModel):
    south: float
    west: float
    north: float
    east: float


class MapConfig(BaseModel):
    region_name: str
    center_lat: float
    center_lng: float
    bounds: MapBounds
    min_zoom: float
    max_zoom: float
    default_zoom: float
    zoom_snap: float
    wheel_px_per_zoom_level: int
    tile_url: str
    tile_attribution: str
    default_radius_km: float
    max_radius_km: float
