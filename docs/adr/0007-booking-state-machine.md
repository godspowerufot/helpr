# 0007. Explicit booking state machine with an audit trail

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0005, ADR 0008

## Context
Trust in a marketplace depends on both sides seeing the same, predictable booking status.
Ad-hoc status updates from different endpoints produce impossible states.

## Decision

States: `requested`, `accepted`, `declined`, `paid`, `completed`, `cancelled`.

| From | To | Actor | Rule |
|---|---|---|---|
| (new) | `requested` | Customer | Listing is `published`; customer is not a member of the listing's provider workspace |
| `requested` | `accepted` | Provider (owner/admin) | |
| `requested` | `declined` | Provider (owner/admin) | Optional reason |
| `requested` | `cancelled` | Customer | |
| `accepted` | `paid` | Customer | Via Paystack verify through `msflib-payments` (ADR 0019, supersedes 0008) |
| `accepted` | `cancelled` | Customer or provider | Reason required |
| `paid` | `completed` | Provider (owner/admin) | |

Terminal states: `declined`, `cancelled`, `completed`. Cancelling after `paid` is not
allowed in the MVP (no refunds).

Rules:
- All transitions go through a single `BookingService.transition(session, booking, to_status,
  actor, reason=None)`. No other code assigns `booking.status`.
- Each transition writes a `BookingEvent` row (`booking_id`, `from_status`, `to_status`,
  `actor_account_id`, `actor_role` customer|provider, `reason`, `created_at`) in the same
  transaction. The UI timeline is built from these rows.
- An invalid transition returns 409 with the current status. A wrong actor returns 403.
- The booking snapshots `price_amount` and `currency` from the listing at request time.

## Alternatives considered
- Free-form status updates: rejected; untestable.
- A workflow library: rejected; overkill for 6 states.

## Consequences
One place to test exhaustively (every pair of state × actor). Adding states later (for
example `in_progress`, `disputed`) is a table change plus tests.
