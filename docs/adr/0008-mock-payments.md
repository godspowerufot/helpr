# 0008. Payments are simulated behind a gateway interface

- Status: Superseded by [ADR 0019](0019-paystack-payments-msflib.md)
- Date: 2026-10-09
- Depends on: ADR 0007

## Context
The brief says payments are mocked in the initial build. `msflib-payments` exists (Paystack,
Stripe) but needs gateway keys, a redirect flow, and has documented gaps (no webhooks,
refunds or payouts).

## Decision
- A `PaymentGateway` protocol with one MVP implementation, `MockPaymentGateway`.
- `POST /api/v1/bookings/{id}/pay` (customer, booking `accepted`) calls the gateway, stores a
  `Payment` row (`booking_id` unique, `amount`, `currency`, `status` succeeded|failed,
  `reference` = `MOCK-<uuid>`, `created_at`) and transitions the booking to `paid`.
- The mock always succeeds, unless the request sets `simulate_failure: true` (for demoing the
  error state).
- The UI says plainly, at the pay step and on receipts: "Payments are simulated in this
  demo. No money moves."
- `msflib-payments` is not installed in the MVP.

## Alternatives considered
- `msflib-payments` with Paystack test mode: rejected for the MVP; it adds the redirect and
  verify flow and external keys for no demo benefit. It is the planned replacement.

## Consequences
The payment step is honest and testable. Swapping in a real gateway means a new
`PaymentGateway` implementation and a superseding ADR, not changes to booking logic.
