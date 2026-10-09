# 0015. Use only the MSFLib modules that ship with the template

- Status: Accepted, amended by [ADR 0019](0019-paystack-payments-msflib.md) (adds `msflib-payments`) and [ADR 0021](0021-in-app-notifications-msflib.md) (adds `msflib-notifications`)
- Date: 2026-10-09
- Depends on: ADR 0002, 0008, 0012

## Context
The hackathon constraint is to build on the MSFLib FastAPI template as provided. The
template's `pyproject.toml` ships: core, auth, account, workspaces, tenancy, ai-core, ai-api,
documents, ingestion and knowledge.

## Decision
- `backend/pyproject.toml` stays identical to the template's. We add no `msflib-*` packages.
- Helpr uses:

| Module | Used for |
|---|---|
| core | Settings, `ModelAction`, event bus, DB session, seeding |
| auth | Login, logout, account and workspace dependencies |
| account | Accounts, open registration, profiles |
| workspaces, tenancy | Provider businesses and isolation (ADR 0005) |
| ai-core, ai-api, documents, ingestion, knowledge | Shipped by the template; not used by the MVP |

- Capabilities outside these modules (payments, notifications) are either simulated
  (ADR 0008) or built from Helpr data (ADR 0012).

## Alternatives considered
- Adding `msflib-notifications`, `msflib-payments` or others: rejected by the constraint.

## Consequences
Smaller surface area and no dependency drift from the template. Any future module addition
needs a superseding ADR and confirmation that the constraint allows it.
