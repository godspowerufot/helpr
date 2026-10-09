# 0022. Eket service region, nearby search and a Leaflet map

- Status: Accepted; "Frontend map" superseded by ADR 0025 (Google Maps embed, Leaflet removed)
- Date: 2026-10-09
- Amends: ADR 0015 and 0016 (one named frontend exception: `leaflet` + `react-leaflet`),
  `MVP.md` (moves "Maps" from Later into the MVP)
- Depends on: ADR 0005, 0006, 0007, 0009

## Context
The project owner is in Eket (Akwa Ibom) and wants customers to see providers close to them
on a map, book them, and have the demo restricted to Eket with mock data. MSFLib has no
geo or map module, and the React template ships no map component. OpenStreetMap is the
open data source; Leaflet is the standard open-source library to render its tiles.

## Decision
- **Service region (backend owns it).** Helpr serves one region, configured with flat
  settings: `SERVICE_REGION_NAME` (`Eket`), `MAP_CENTER_LAT/LNG`, `MAP_BOUNDS_SOUTH/WEST/NORTH/EAST`,
  zoom (`MAP_MIN_ZOOM`, `MAP_MAX_ZOOM`, `MAP_DEFAULT_ZOOM`, `MAP_ZOOM_SNAP`,
  `MAP_WHEEL_PX_PER_ZOOM_LEVEL`), tiles (`MAP_TILE_URL`, `MAP_TILE_ATTRIBUTION`) and radius
  (`NEARBY_DEFAULT_RADIUS_KM`, `NEARBY_MAX_RADIUS_KM`). Public `GET /map/config` returns them;
  the frontend never hard-codes the region or zoom.
- **Coordinates.** `ProviderProfile.latitude/longitude` (the provider's base) and optional
  `Booking.latitude/longitude` (the customer's job site). Both must fall inside the region
  bounds (422 "Helpr is only available in Eket for now.").
- **Nearby search.** `GET /listings?lat=&lng=&radius_km=&sort=distance` and
  `GET /providers/nearby?lat=&lng=&radius_km=&category=` filter by a bounding box in SQL and
  by great-circle (haversine) distance in Python, return `distance_km`, and sort nearest
  first. No PostGIS: SQLite in dev, a few hundred providers at most.
  A point outside the region is 422; `radius_km` is capped at `NEARBY_MAX_RADIUS_KM`.
- **Customer location** comes from the browser (`navigator.geolocation`) only when the
  customer asks ("Use my location"). If it is denied or outside the region, the map uses
  the region centre. It is never stored on the account (MSFLib tables are not extended);
  it is stored only on a booking, as the job site.
- **Frontend map.** `leaflet` + `react-leaflet` (+ `@types/leaflet`), raster tiles of
  OpenStreetMap data with attribution (tile server is a setting; see Consequences). This is the only frontend package outside the React template. It is
  loaded client-side only (`next/dynamic`, `ssr: false`) because the app is a static export.
  Markers are `CircleMarker`s styled with tokens (no image assets). Zoom: Leaflet's default
  control is replaced by our own buttons (zoom in, zoom out, back to Eket, use my location);
  scroll-wheel zoom turns on only after the map is clicked or focused (so page scroll is not
  captured), with the backend's `zoom_snap` and `wheel_px_per_zoom_level`; `maxBounds`
  keeps the view inside the region.
- **Seed data** lives in Eket (Grace Bill Road, Marina Road, Atabong Road, Afaha Eket, …),
  with coordinates for every provider.

## Alternatives considered
- OpenStreetMap embed iframe (no package): one marker, no custom zoom, no clicks to book.
  Rejected by the owner.
- Mapbox / Google Maps: API keys, billing and non-open data. Rejected.
- PostGIS / SpatiaLite: overkill for one town; adds a database extension to the template.
- Storing the customer's location on `Profile`: needs changing an MSFLib table. Rejected.

## Consequences
- `frontend/package.json` differs from the template by `leaflet`, `react-leaflet` and
  `@types/leaflet`. Checkpoint 0.7 checks for exactly these.
- Tiles: the default is CARTO's free "Voyager" raster basemap, which renders OpenStreetMap
  data (attribution to both shown). `tile.openstreetmap.org` was unreachable from the
  development network (connection refused, while CARTO, openstreetmap.de and
  openstreetmap.fr answered), and OSM's tile usage policy discourages app traffic anyway.
  The tile URL is a setting (`MAP_TILE_URL` with Leaflet's `{s}`/`{z}`/`{x}`/`{y}`), so any
  OSM tile server can be swapped in without code changes; production traffic needs a tile
  plan.
- Adding a second town means widening the bounds settings; nothing else changes.
