# 0009. Public marketplace reads are custom unauthenticated endpoints

- Status: Accepted (validated 2026-10-09 by `app/tests/api/api_v1/test_marketplace.py`:
  anonymous and signed-in customer get identical 200 responses; draft/archived listings and
  workspaces without a `ProviderProfile` are 404; responses carry public fields only)
- Date: 2026-10-09
- Depends on: ADR 0005; facts register `get_current_workspace_anonymous` (#269); open question Q1

## Context
Visitors and customers must browse categories, listings, provider profiles and reviews
without belonging to any provider workspace. MSFLib's `get_current_workspace_anonymous`
resolves a workspace without auth, but performs no membership check, and returns the raw
workspace row.

## Decision
- Public routes have no workspace dependency. They use no auth, or
  `get_current_account_or_none` where personalisation helps.
- They query our own tables and return **public response schemas only**: `ListingPublic`,
  `ProviderPublic`, `ReviewPublic`. Never return MSFLib `Workspace`, `User` or `Account` rows
  directly.
- Public routes only ever return `published` listings and providers with a `ProviderProfile`.
- Provider pages are addressed by the workspace slug, looked up through `ProviderProfile`.

Routes: `GET /categories`, `GET /listings`, `GET /listings/{id}`, `GET /listings/{id}/reviews`,
`GET /providers/{slug}`.

## Alternatives considered
- `get_current_workspace_anonymous` for provider pages: rejected; it exposes the workspace
  row and is flagged as behaviour that may change.

## Consequences
Answers Q1 by design: browsing never touches workspace membership. Must be confirmed by the
Checkpoint 0 tests (anonymous and fresh customer both get 200).
