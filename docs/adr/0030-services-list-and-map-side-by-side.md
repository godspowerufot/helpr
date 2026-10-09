# 0030. Services page: list and map side by side

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0025, the "Map tab" and "nearby providers list" layout only (the keyless
  Google embed, region check, radius and "Use My Location" stay as decided there)
- Depends on: ADR 0022, 0025, 0026

## Context
ADR 0025 put the services list and the Google map on separate tabs, with a nearby-providers
list beside the map. The customer could never compare a service with where it is. The project
owner asked for the layout used by booking marketplaces: cards on one side, the map on the
other.

## Decision
- From `lg` (1024 px) up, `/services` shows the filter bar, then two columns: service cards on
  the left (one column at `lg`, two from `xl`) and a sticky map panel on the right that fills
  the viewport height.
- The map follows the cards: hovering a card (after 250 ms) or focusing it with the keyboard
  re-centres the embed on that listing's coordinates and outlines the card. With no card
  chosen, the map shows the customer's point or the region centre from `GET /map/config`.
- The map panel keeps the radius buttons, "Use My Location" and "Any Distance". Choosing a
  radius filters the cards (`lat`, `lng`, `radius_km` on `GET /listings`), so the list and the
  map always describe the same area.
- Below `lg`, a List / Map switch shows one column at a time; `?view=map` selects the map. In
  the map view, a row of service chips (title + price) moves the map, since there is no hover.
- The nearby-providers list (`GET /providers/nearby`) is no longer shown on `/services`. The
  account panel that sat beside the results is removed; sign-in lives in `SiteNav`.

## Alternatives considered
- Keep the tabs: the request was to see cards and map together.
- One pin per card on the map: needs the Maps JavaScript API with a key and billing, rejected
  in ADR 0025 for the demo.
- Re-centre the map only on click: a card click opens the service, so hover and focus are the
  only gestures left that do not navigate.

## Consequences
- Each preview reloads the iframe; the 250 ms hover delay keeps a sweep across cards from
  reloading it for every card.
- Listings without coordinates cannot be shown; the caption says so.
- `useNearbyProviders` and `mapApi.nearby` have no caller on the services page; keep them for
  a later provider map or remove them in a cleanup.
