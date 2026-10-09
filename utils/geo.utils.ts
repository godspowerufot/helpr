import { LatLng, MapBounds } from '@/types/map.types';

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const isInBounds = (point: LatLng, bounds: MapBounds) =>
  point.lat >= bounds.south &&
  point.lat <= bounds.north &&
  point.lng >= bounds.west &&
  point.lng <= bounds.east;

const coords = (point: LatLng) =>
  `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

// Keyless Google Maps embed (ADR 0025): one pin at `point`, no API key.
export const googleEmbedUrl = (point: LatLng, zoom: number) =>
  `https://maps.google.com/maps?q=${coords(point)}&z=${Math.round(zoom)}&output=embed`;

export const googleMapsLink = (point: LatLng) =>
  `https://www.google.com/maps/search/?api=1&query=${coords(point)}`;

const kmFormat = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1 });

export const formatDistance = (km: number | null | undefined) =>
  km == null
    ? ''
    : km < 1
      ? `${Math.round(km * 1000)} m away`
      : `${kmFormat.format(km)} km away`;
