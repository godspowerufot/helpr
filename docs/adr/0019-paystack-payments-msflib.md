# 0019. Customers pay for bookings with Paystack through `msflib-payments`

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0008 (simulated payments)
- Amends: ADR 0015 (adds exactly one module beyond the template: `msflib-payments`)
- Depends on: ADR 0007, 0011; facts register "Payments (msflib-payments)"

## Context
The team wants real payment rails: customers pay providers for completed work through
Paystack, using MSFLib rather than custom code. `msflib-payments` (`modules/payments`,
tag `payments-v0.2.1`) ships a `PaystackGateway`, a `Payment` table, `process_payment` and a
router with `GET /payments/verify/{reference}` that fires a fulfilment event.

What it does **not** do: payouts. There are no Paystack transfers, subaccounts or split
payments in the module. It collects money from the customer into the platform's Paystack
account. Webhooks, refunds and invoices are also out of scope (docs, "Purpose").

## Decision
- Add `msflib-payments` (`payments-v0.2.1`) to the backend. It is the only module allowed
  beyond the template; every other ADR 0015 rule stands.
- Paystack **test mode only** (`sk_test_...` in `backend/.env`). No live keys in this build.
- Flow for an `accepted` booking:
  1. Customer calls Helpr `POST /bookings/{id}/pay`. `BookingService` checks the customer
     and status, then awaits `process_payment(session, PaymentData(email, amount=price_amount / 100,
     gateway="paystack", description, callback_url=CLIENT_HOST + "/bookings/payment"),
     account, settings, queue_event_key="booking-payment", queue_data={"booking_id": id})`.
     Response: `{payment_id, reference, authorization_url}`.
  2. The frontend sends the customer to `authorization_url` (Paystack checkout).
  3. Paystack returns to `/bookings/payment?reference=...`; that page calls MSFLib
     `GET /payments/verify/{reference}`.
  4. On success MSFLib emits `payment-queue-execute-booking-payment`. Helpr's listener in
     `app/eventbus/`, registered on the app emitter, calls
     `BookingService.transition(booking, "paid", actor=customer)` and does not commit.
- `booking.payment_id` references MSFLib's `payment.id`. Helpr's own `payment` table from
  ADR 0008 is dropped.
- Provider payouts are **not automated**. Earnings (ADR 0007, `PROPOSAL.md` §8) are computed
  from verified payments of completed bookings and shown as "Due to you"; settling them to
  the provider's bank is a manual operation outside the MVP.
- If `PAYSTACK_SECRET_KEY` is empty, `POST /bookings/{id}/pay` returns 503 "Payments are
  not configured". The rest of the API keeps working, so `/health` does not degrade.

## Alternatives considered
- Keep simulated payments (ADR 0008): rejected; the team wants a real gateway through MSFLib.
- Call Paystack directly, including the Transfers API for payouts: rejected; bypasses MSFLib
  and adds payout compliance (bank verification, transfer recipients) we cannot finish.
- Stripe through the same module: rejected; the module fixes Stripe currency to USD.

## Consequences
- `backend/pyproject.toml` differs from the template by exactly one line (`msflib-payments`).
  Checkpoint 0.7 checks that.
- Known module issues (#273): the router stores `verified` while gateways report
  `fulfilled`; `PaymentProcessor` always builds a Stripe gateway (sets `stripe.api_key`
  globally, harmless with an empty key); `msflib-account` must be installed by us (it is).
- Money conversion: Helpr stores kobo (ADR 0011); `PaymentData.amount` is naira, so divide by
  100. The module multiplies back by 100 and the verify route rejects amount mismatches.
- Verification is pull-based: if the customer closes the tab before the callback page loads,
  the booking stays `accepted` until verify is called again (the booking view retries verify
  for a pending payment reference).
- The payment disclosure changes from "simulated" to "Test payments via Paystack. Use a
  Paystack test card; no real money moves."
