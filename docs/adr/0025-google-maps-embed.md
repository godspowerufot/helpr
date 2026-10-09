# 0025. Google Maps embed instead of Leaflet

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0022, "Frontend map" only (region settings, coordinates, nearby search and
  customer location stay as decided there)
- Depends on: ADR 0016, 0022

## Context
ADR 0022 rendered the services map with `leaflet` + `react-leaflet` and OpenStreetMap tiles, the
only frontend packages outside the React template. The project owner asked for a Google map on
the services page instead.

## Decision
- The Map tab on `/services` shows a **keyless Google Maps embed** (`<iframe>` to
  `https://maps.google.com/maps?q=<lat>,<lng>&z=<zoom>&output=embed`). The URL is built in
  `utils/geo.utils.ts` (`googleEmbedUrl`); the iframe lives in `components/map/GoogleMapEmbed.tsx`.
- The embed shows one location. Next to it, the nearby providers list (still from
  `GET /providers/nearby`) lets the customer pick a provider; the map re-centres on that
  provider's coordinates. With no provider, it shows the region centre from `GET /map/config`.
- Radius, "Use My Location" and the region check work as in ADR 0022, outside the iframe.
  Each provider row links to its service, and the map has an "Open in Google Maps" link.
- `leaflet`, `react-leaflet` and `@types/leaflet` are removed. `frontend/package.json` is back to
  the template's dependency list (ADR 0016).

## Alternatives considered
- Keep Leaflet: not what the owner asked for.
- Google Maps Embed API or Maps JavaScript API with a key: supports more than one pin, but needs a
  Google Cloud project with billing and a key in the frontend. Rejected for the demo.

## Consequences
- No pin per provider and no "Search This Area": the map shows one place at a time.
- The keyless `output=embed` URL is not a documented Google API and could change. If it
  breaks, switch `googleEmbedUrl` to the Maps Embed API (`/maps/embed/v1/place?key=…`).
- `MAP_TILE_URL`, `MAP_TILE_ATTRIBUTION`, `MAP_ZOOM_SNAP` and `MAP_WHEEL_PX_PER_ZOOM_LEVEL`
  from `GET /map/config` are no longer used by the frontend; the backend may keep serving them.
- The browser loads the map from Google, so Google receives the visitor's IP and the shown point.
