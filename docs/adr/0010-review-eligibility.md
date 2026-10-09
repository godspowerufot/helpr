# 0010. One review per completed booking, by its customer

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0007

## Context
Reviews are the main trust signal. Unrestricted reviews invite fake ratings.

## Decision
- `Review` (`id`, `booking_id` unique, `listing_id`, `provider_workspace_id`,
  `customer_account_id`, `rating` 1..5, `comment` ≤ 1000 chars, `created_at`).
- Eligibility: the booking is `completed`, the caller is the booking's customer, and no
  review exists for that booking. Otherwise 403 (not your booking), 409 (already reviewed
  or not completed).
- Reviews are immutable in the MVP.
- On create, recompute `rating_avg` and `rating_count` on the listing and the
  `ProviderProfile` in the same transaction.

## Alternatives considered
- Reviews per listing without a booking: rejected; unverifiable.
- Editable reviews: deferred.

## Consequences
Every displayed rating is backed by a completed booking. "Verified booking" can be shown on
every review.
