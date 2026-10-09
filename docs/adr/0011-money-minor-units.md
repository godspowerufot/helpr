# 0011. Money stored as integer minor units (kobo)

- Status: Accepted
- Date: 2026-10-09

## Context
Floating-point money causes rounding errors. The MVP serves one currency.

## Decision
- All money fields are integers in minor units (`price_amount = 1500000` means ₦15,000.00),
  paired with a `currency` field (`NGN` in the MVP).
- API contracts send and receive minor units. Only the frontend formats for display, using
  `Intl.NumberFormat("en-NG", { style: "currency", currency })`.

## Alternatives considered
- `Decimal` in major units (as `msflib-payments` uses): rejected; integers are simpler across
  SQLite, Postgres and JSON. Convert at the boundary if `msflib-payments` is adopted.

## Consequences
No rounding bugs; one formatting function on the frontend.
