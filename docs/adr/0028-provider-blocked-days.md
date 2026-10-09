# 0028. Provider availability as blocked days

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0005, 0007, 0009, 0022

## Context

The project owner wants providers to mark days they cannot work, and the booking form to stop
customers picking those days. A full weekly schedule with time slots is out of scope for the
MVP. All providers are in Eket (ADR 0022), so "a day" means a calendar day in `Africa/Lagos`
(UTC+1, no daylight saving). `FormBuilder` has no calendar that can disable dates
(`eType: 'calendar'` renders nothing; `date` is a native input), see `docs/msflib-facts.md`.

## Decision

- New table `providerblockedday` (`app/models/provider_blocked_day.py`):
  `provider_workspace_id`, `day` (date), `note` (≤ 140, provider-only); unique on
  (`provider_workspace_id`, `day`).
- Provider routes (ADR 0005 dependencies): `GET /{slug}/provider/blocked-days` (today onward,
  ascending), `POST /{slug}/provider/blocked-days` (`{day, note}`; past day → 422, duplicate →
  409), `DELETE /{slug}/provider/blocked-days/{day}` (returns the remaining days; not found →
  404).
- Public route (ADR 0009, public schema without notes): `GET /providers/{slug}/blocked-days`
  → `["YYYY-MM-DD", …]` from today for 180 days.
- `POST /bookings` rejects a `scheduled_for` whose `Africa/Lagos` date is blocked for the
  listing's business with **409** "The provider is not available on that day. Pick another
  date." Blocking a day does not touch existing bookings; the provider handles those with the
  normal decline/cancel transitions (ADR 0007).
- Frontend: `/provider/availability` lists upcoming blocked days with a `FormBuilder` (date +
  note) and a remove action (`AppConfirmDialog`). The booking wizard loads the public list,
  shows the unavailable days next to the date field and rejects them in `FormBuilder`
  validation; the server check stays authoritative.

## Alternatives considered

- Weekly hours and per-slot availability: more model, more UI, not requested for the MVP.
- Disabling days inside the date picker: needs a date-picker package outside the stack (ADR
  0016); the native input cannot disable individual days.
- Checking only in the frontend: a stale page or a direct API call could still book a blocked
  day.

## Consequences

- One extra query per booking request.
- Blocked days are whole days; partial-day unavailability is expressed by declining.
- Run `python -m app.update_data` once to create the table on an existing database.
