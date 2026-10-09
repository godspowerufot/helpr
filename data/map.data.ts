import { MapConfig } from '@/types/map.types';

// Same values as the backend defaults in `app/core/config.py` (ADR 0022).
export const MOCK_MAP_CONFIG: MapConfig = {
  region_name: 'Eket',
  center_lat: 4.642,
  center_lng: 7.923,
  bounds: { south: 4.58, west: 7.85, north: 4.72, east: 8.02 },
  min_zoom: 12,
  max_zoom: 18,
  default_zoom: 14,
  zoom_snap: 0.5,
  wheel_px_per_zoom_level: 120,
  tile_url:
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  tile_attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  default_radius_km: 5,
  max_radius_km: 25,
};
