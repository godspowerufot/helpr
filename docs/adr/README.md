# Architecture Decision Records

Each ADR records one decision, why we made it, what we rejected, and what it costs us.
An ADR is a proposal until its status says otherwise. Never build on a `Proposed` or
`Needs validation` ADR without first completing its validation steps.

## Statuses

| Status | Meaning |
|---|---|
| Proposed | A candidate decision that needs review |
| Needs validation | Depends on an unverified technical assumption (see `docs/msflib-facts.md`) |
| Accepted | Approved and currently binding |
| Rejected | Considered but not selected |
| Superseded | Replaced by a newer decision (link to it) |
| Deprecated | No longer recommended |

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-backend-msflib-fastapi-template.md) | Backend built on the MSFLib FastAPI template | Accepted |
| [0003](0003-frontend-standalone-nextjs.md) | Frontend is a standalone Next.js app following MSFLib React conventions | Superseded by 0016 |
| [0004](0004-identity-msflib-accounts.md) | One MSFLib account per person; customers and providers share identity | Accepted |
| [0005](0005-provider-as-workspace.md) | A provider business is an MSFLib workspace | Needs validation |
| [0006](0006-generic-listing-model.md) | Generic service listing model | Accepted |
| [0007](0007-booking-state-machine.md) | Explicit booking state machine with an audit trail | Accepted |
| [0008](0008-mock-payments.md) | Payments are simulated behind a gateway interface | Superseded by 0019 |
| [0009](0009-public-marketplace-reads.md) | Public marketplace reads are custom unauthenticated endpoints | Accepted |
| [0010](0010-review-eligibility.md) | One review per completed booking, by its customer | Accepted |
| [0011](0011-money-minor-units.md) | Money stored as integer minor units (kobo) | Accepted |
| [0012](0012-notifications-msflib.md) | Booking notifications via msflib-notifications | Rejected, superseded by 0021 |
| [0013](0013-token-storage.md) | Bearer token in localStorage for the MVP | Accepted |
| [0014](0014-schema-management.md) | `create_all` for the MVP, Alembic baseline before deployment | Proposed |
| [0015](0015-msflib-module-selection.md) | Use only the MSFLib modules that ship with the template | Accepted, amended by 0019, 0021 |
| [0016](0016-frontend-msflib-react-template.md) | Frontend is built on the MSFLib React template and `@msflib/*` packages | Accepted |
| [0017](0017-minimal-design-language.md) | Minimal design language expressed only through template tokens | Superseded by 0018 |
| [0018](0018-editorial-dark-design-and-web-interface-guidelines.md) | Editorial dark design language and Vercel Web Interface Guidelines | Look superseded by 0020; guidelines still Accepted |
| [0019](0019-paystack-payments-msflib.md) | Customers pay for bookings with Paystack through `msflib-payments` | Accepted |
| [0020](0020-quorvix-design-system.md) | Quorvix design system for the UI layer | Accepted; typeface amended by 0023; colours, radii and headings superseded by 0026 |
| [0021](0021-in-app-notifications-msflib.md) | Activity notifications through `msflib-notifications` (in-app inbox) | Accepted |
| [0022](0022-eket-map-and-nearby-search.md) | Eket service region, nearby search and a Leaflet map | Accepted; map rendering superseded by 0025 |
| [0023](0023-geist-typeface.md) | Geist typeface | Accepted |
| [0024](0024-landing-monochrome-glass.md) | Monochrome glass look for the landing page | Accepted; widened to the whole app by 0026 |
| [0025](0025-google-maps-embed.md) | Google Maps embed instead of Leaflet | Accepted; Map tab layout superseded by 0030 |
| [0026](0026-app-wide-monochrome-glass.md) | Monochrome glass across the whole app | Accepted |
| [0027](0027-provider-photos-msflib-uploads.md) | Provider photos stored through MSFLib uploads | Accepted |
| [0028](0028-provider-blocked-days.md) | Provider availability as blocked days | Accepted |
| [0029](0029-google-sign-in.md) | Google sign-in through MSFLib auth | Accepted |
| [0030](0030-services-list-and-map-side-by-side.md) | Services page: list and map side by side | Accepted |
| [0031](0031-notification-links.md) | Activity notifications link to the booking they describe | Accepted |

## Template

Copy this into `NNNN-short-title.md` and add a row to the index.

```markdown
# NNNN. Title

- Status: Proposed
- Date: YYYY-MM-DD
- Depends on: ADR numbers, facts register rows

## Context
What forces are at play? Cite `docs/msflib-facts.md` rows for any MSFLib claim.

## Decision
What we will do, stated as rules.

## Alternatives considered
Each option and why it lost.

## Consequences
What becomes easier, what becomes harder, what we must now maintain.

## Validation (only for Needs validation)
The exact test that moves this ADR to Accepted or Rejected.
```
