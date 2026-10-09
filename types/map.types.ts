import { PricingType, ProviderPublic } from './listing.types';

// Mirrors `MapConfig` from `GET /map/config` (ADR 0022): the backend owns region and zoom.
export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type MapConfig = {
  region_name: string;
  center_lat: number;
  center_lng: number;
  bounds: MapBounds;
  min_zoom: number;
  max_zoom: number;
  default_zoom: number;
  zoom_snap: number;
  wheel_px_per_zoom_level: number;
  tile_url: string;
  tile_attribution: string;
  default_radius_km: number;
  max_radius_km: number;
};

export type LatLng = { lat: number; lng: number };

export type NearParams = LatLng & { radius_km?: number };

export type PinListing = {
  id: number;
  title: string;
  pricing_type: PricingType;
  price_amount: number;
  currency: string;
};

export type ProviderPin = ProviderPublic & {
  distance_km: number;
  listing_count: number;
  categories: string[];
  listings: PinListing[];
};

export type NearbyQuery = LatLng & {
  radius_km: number;
  category?: string;
};
