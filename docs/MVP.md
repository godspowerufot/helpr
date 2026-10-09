# Helpr — MVP Map

The MVP is one complete, trustworthy loop, built as a vertical slice:

**discover → request booking → provider accepts → Paystack test payment → provider completes →
customer reviews**

Everything not needed for that loop, or for making it feel trustworthy, waits.

## 1. Feature map

| Area | MVP (must) | Should (if time) | Later |
|---|---|---|---|
| Discovery | Category list, listing search/filter (category, text, area), sort by price/rating/distance, listing detail, provider profile with photos, Eket service region with nearby search and a Map tab (ADR 0022, 0025) | Featured listings on home | Availability search, more regions |
| Accounts | Sign up, log in, log out (MSFLib) | Edit profile (MSFLib `/me`, `/profiles`) | Google sign-in, password reset UI |
| Become a provider | Onboarding form creating the provider business | Invite a team member | KYC/verification badge |
| Provider profile | Business details, location; business photo and up to 8 work photos via MSFLib uploads (ADR 0027); blocked days off (ADR 0028) | Photo reordering | Per-listing photos, weekly hours, time slots |
| Listings (provider) | Create, edit, publish, archive | Duplicate listing | Packages |
| Booking (customer) | Request with date/time, address, notes; my bookings; booking detail with timeline; cancel | Reschedule | Recurring bookings |
| Booking (provider) | Inbox by status; accept, decline (reason), cancel (reason), complete | Filters by date | Calendar view |
| Payment | Paystack test-mode checkout via msflib-payments (ADR 0019); verify on return; receipt | Retry verify from the booking view | Live keys; provider payouts (Paystack transfers) |
| Reviews | 1–5 stars + comment after completion; shown on listing and provider | Provider reply | Moderation |
| Booking updates | Timeline from booking events; "needs action" counts; in-app notification inbox via `msflib-notifications` with unread count and auto-refresh (ADR 0021) | Toast when a status changes | Email, SMS |
| Earnings | Completed count, total earned, pending, recent list | Per-listing breakdown | Payouts |

## 2. User stories and acceptance criteria

IDs are referenced from tests and commits.

### Customer

- **C1 Browse.** As a visitor I can browse categories and published listings without signing in.
  - Anonymous `GET /listings` returns only `published` listings. Draft/archived never appear.
  - Search, category filter and sort work together; empty results show an empty state with a
    "clear filters" action.
- **C2 Compare.** On a listing I see price (formatted ₦), pricing type, duration, service area,
  provider name, rating average and count, and recent reviews marked "Verified booking".
- **C3 Sign up and log in.** I can create an account and log in; after login I return to the
  page I came from.
- **C4 Request.** Signed in, I can request a booking for a published listing with a future
  date/time, address and optional notes.
  - The booking starts as `requested` with the listing's price snapshot.
  - I cannot book a listing from a provider business I belong to (403 with a clear message).
  - I cannot book a day the provider has blocked (409, ADR 0028); the booking form lists those
    days before I pick a date.
- **C5 Track.** I see my bookings grouped by status and a detail page with a timeline built from
  booking events.
- **C6 Cancel.** I can cancel while `requested` or `accepted` (reason required when `accepted`).
- **C7 Pay (Paystack test mode).** When `accepted`, I can pay. I am sent to Paystack checkout;
  on return the app calls `GET /payments/verify/{reference}`, the booking moves to `paid` and
  I see a receipt with the Paystack reference. The page states payments are in test mode.
- **C8 Review.** After `completed`, I can leave one 1–5 star review with an optional comment.
  The listing and provider ratings update immediately.

### Provider

- **P1 Become a provider.** From my account I can create a provider business (name, bio,
  service area, phone). I become its owner.
- **P2 Manage listings.** I can create a draft, edit it, publish it and archive it. Only
  published listings are public.
- **P3 Inbox.** I see incoming bookings by status, newest first.
- **P4 Decide.** I can accept or decline a `requested` booking (decline reason optional).
- **P5 Complete.** I can mark a `paid` booking `completed`.
- **P6 Earnings.** I see completed jobs count, total earned, pending amount, and recent paid
  bookings.
- **P7 Isolation.** I cannot see or change another provider's listings, bookings, photos or
  blocked days (403).
- **P8 Photos.** I can upload, replace and remove a business photo and add up to 8 work photos
  with captions (JPEG, PNG or WebP, 5 MB max); they show on my public page (ADR 0027).
- **P9 Days off.** I can block and unblock future days; customers cannot request those days
  (ADR 0028).

### Cross-cutting

- **X1 Booking updates.** Each side sees the other's changes within 20 seconds without
  reloading: the booking timeline updates, and "needs action" counts appear on the provider
  dashboard (new requests) and the customer's bookings list (payment due, review due).
- **X2 States.** Every page has loading, empty and error states; every mutation shows pending
  and error feedback.
- **X3 Honesty.** Test-mode payment is disclosed wherever payment appears (`AppPaymentNotice`).

## 3. Screens

| Route (frontend) | Group | Story |
|---|---|---|
| `/` | public | C1 — search + categories |
| `/services` | public | C1 — results with filters |
| `/services/view?id=` | public | C2, C4 entry |
| `/providers/view?slug=` | public | C2 |
| `/login`, `/register` | auth | C3 (template screens, `useAuth`) |
| `/bookings` | protected | C5 |
| `/bookings/manage?listing_id=` | protected | C4 |
| `/bookings/view?id=` | protected | C5, C6, C7, C8 |
| `/provider/onboard` | protected | P1 |
| `/provider` | protected | P3, P6 — dashboard (active workspace = provider slug) |
| `/provider/listings`, `/provider/listings/manage?id=` | protected | P2 (`TableWidget`, `FormBuilder`) |
| `/provider/bookings`, `/provider/bookings/view?id=` | protected | P4, P5 |
| `/provider/availability` | protected | P9 |
| `/provider/profile` | protected | P1 (edit), P8 — Details, Business Photo, Work Photos cards |

Static export (ADR 0016): no `[id]` routes. Details in `FRONTEND.md` §4.

## 4. Checkpoint 0 — validate the foundation (first, before features)

Starts as soon as `poetry install` completes:

| # | Check | Pass condition | Decides |
|---|---|---|---|
| 0.1 | Backend boots | `poetry install`, `python -m app.initial_data`, `uvicorn app.main:app` start; `/docs` loads | ADR 0002 |
| 0.2 | Auth round trip | `POST /open` → 201; `POST /login` → token; `GET /me` → 200; `DELETE /logout` then `/me` → 401 | ADR 0004 |
| 0.3 | Frontend integration (Q3, Q7) | Regenerated template frontend: register and login through `useAuth()` from `localhost:3000`; `me` shows the account; logout works | ADR 0013, 0016 |
| 0.4 | Provider onboarding (Q4) | Throwaway endpoint calls `workspace_action.create_with_owner`; owner membership exists | ADR 0005 |
| 0.5 | Isolation (Q2, Q6) | Two providers; A gets 403 on B's `/{slug}/provider/...` probe route; `default` slug gets 404; with `setActiveWorkspace(A)` the frontend's `/provider/...` call reaches A's route | ADR 0005, 0016 |
| 0.6 | Public reads (Q1) | A probe public route returns 200 with no token and with a fresh customer token | ADR 0009 |
| 0.7 | Template-only dependencies | `backend/pyproject.toml` differs from the template only by the `msflib-payments` line (ADR 0019); `frontend/package.json` has no dependency beyond the React template's | ADR 0015, 0016 |
| 0.8 | Frontend scaffold | `frontend/` regenerated with `npx @msflib/react-template` (multi-tenant, path); dark Helpr tokens and images applied; template samples removed; `pnpm lint` and `pnpm build` pass; `web-design-guidelines` review clean | ADR 0016, 0018 |

Record every outcome in `msflib-facts.md` (promote to `Verified (runtime)`) and update the
ADR status. If 0.4 or 0.5 fails, switch to the ADR 0005 fallback before writing features.

## 5. Milestones

| # | Milestone | Done when | Est. hours |
|---|---|---|---|
| M0 | Checkpoint 0 | All checks recorded; ADR statuses updated | 2 |
| M1 | Catalogue | Category seed; provider onboarding; listing CRUD + publish; public list/detail/provider endpoints; tests for P2, P7, C1 | 4 |
| M2 | Booking core | `BookingService` + events; request, accept, decline, cancel, complete; Paystack pay + verify listener (ADR 0019); exhaustive transition tests | 4 |
| M3 | Trust | Reviews with rating aggregation; "needs action" counts; earnings endpoint; tests C8, X1, P6 | 3 |
| M4 | Frontend slice | All MVP screens on `useAuth`, `FormBuilder`, `TableWidget`, wired to the API with loading/empty/error states; editorial dark design and Web Interface Guidelines review (ADR 0018) | 6 |
| M5 | Polish and demo | Seed data (12 home-service categories including private chef, domestic help, laundry, carpentry, painting and AC repair; 12 Eket providers; 23 listings; bookings in every state; reviews); responsive pass; accessibility pass; demo rehearsal | 4 |

Total ≈ 23 hours.

## 6. Cut lines (if behind schedule)

Cut in this order, never further:
1. Provider profile page → link listings to provider name only.
2. Earnings recent list → totals only.
3. "Needs action" counts → booking lists only.

Never cut: the booking state machine and its tests, provider isolation, review eligibility,
the payment disclosure.

## 7. Demo script (4 minutes)

1. Visitor browses "Home cleaning", filters by area, sorts by rating, opens a listing (no login).
2. Ada signs up, requests a booking for Saturday 10:00.
3. Switch to Bola (provider): the request appears on the dashboard with a "1 new" count; Bola accepts.
4. Ada pays with a Paystack test card; returns to the app, payment verifies, receipt shows the Paystack reference; booking timeline updates.
5. Bola marks it completed; earnings update.
6. Ada leaves a 5-star review; the listing rating changes on the public page.
7. Show isolation: Bola's token gets 403 on another provider's bookings (Swagger).
8. Close on the architecture slide: what MSFLib does vs what Helpr adds.

## 8. Definition of done (per story)

- API endpoint with request/response schemas and authorization dependency.
- Tests: happy path, wrong actor (403), invalid state (409) where applicable.
- Frontend screen with loading, empty, error and success states, usable at 360 px width, using MSFLib components (`FormBuilder`, `TableWidget`, `AppSkeleton`) and design tokens only, with a clean `web-design-guidelines` review.
- No new MSFLib API used without a `msflib-facts.md` entry.
- Lint and tests pass in both `backend/` and `frontend/`.
