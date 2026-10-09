# 0012. Booking notifications via msflib-notifications

- Status: Rejected, superseded by [ADR 0021](0021-in-app-notifications-msflib.md)
- Date: 2026-10-09
- Depends on: ADR 0015

## Context
Both sides must learn about booking changes. `msflib-notifications` provides an in-app inbox
and email/SMS fan-out, but it is **not part of the MSFLib FastAPI template**, and the project
constraint is to use only what the template ships (ADR 0015).

## Decision
Rejected. Booking updates are surfaced with Helpr's own data instead:
- The booking timeline is built from `BookingEvent` rows (ADR 0007).
- The provider dashboard and the customer's bookings list show counts of items needing
  action (`requested` for providers, `accepted` awaiting payment for customers).
- The frontend refetches those lists on window focus and every 20 seconds
  (TanStack Query `refetchInterval`), so changes appear without a manual reload.

## Alternatives considered
- `msflib-notifications`: rejected by the template-only constraint.
- Sending email through MSFLib core's email service: rejected for the MVP; that API is not in
  `docs/msflib-facts.md`.
- WebSockets or Server-Sent Events: rejected; more moving parts than the demo needs.

## Consequences
No inbox or email in the MVP. If the constraint is lifted, this ADR can be superseded by one
that adopts `msflib-notifications` (its documented API is kept in the facts register).
