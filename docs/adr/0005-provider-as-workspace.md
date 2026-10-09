# 0005. A provider business is an MSFLib workspace

- Status: Needs validation
- Date: 2026-10-09
- Depends on: ADR 0004, 0016; facts register "Workspaces and tenancy", "Frontend (MSFLib React)"; open questions Q2, Q4, Q6

## Context
Providers need private management areas: their listings, incoming bookings and earnings.
Only the provider's own people may change them. MSFLib workspaces offer exactly this:
membership rows with roles, and request dependencies (`get_current_workspace`,
`get_current_active_user`, `WorkspaceRoleCheck`) that return 403 for non-members.

Complications from the documentation:
- Every new account is automatically a member of the **default** workspace (workspace hook).
  The default workspace must never be treated as a provider.
- The stock `POST /workspaces/` route requires account role `admin`, so ordinary users cannot
  create workspaces through it.

## Decision
- A provider business = one MSFLib workspace + one `ProviderProfile` row
  (`workspace_id` unique). **A workspace is a provider only if it has a `ProviderProfile`.**
- Provider onboarding is our own endpoint `POST /api/v1/providers`, which calls
  `workspace_action.create_with_owner(...)` and creates the `ProviderProfile` in the same
  transaction. The caller becomes the workspace `owner`.
- Provider management routes live under `/api/v1/{workspace_slug}/provider/...` and depend on
  `user_deps.get_current_workspace`, `user_deps.get_current_active_user` and
  `user_deps.WorkspaceRoleCheck([UserType.owner, UserType.admin])`, built with
  `get_user_dependencies(...)` in `app/api/deps.py`. The slug comes first because that is
  where the frontend's `workspaceHookDecorator('path')` puts it (ADR 0016), and the
  backend's `PathParameterResolver` reads the `workspace_slug` path parameter.
- Every provider route also checks that the resolved workspace has a `ProviderProfile`
  (404 otherwise).
- Listings and bookings carry `provider_workspace_id`; every provider query filters on it.

## Alternatives considered
- `ProviderProfile` keyed by `account_id`, no workspace: simpler, but we would write our own
  authorization and lose multi-member businesses. Kept as the fallback if validation fails.
- Our own provider membership table: rejected; duplicates MSFLib workspaces.

## Consequences
- Isolation comes from MSFLib, not our code, which is also the strongest "meaningful use"
  argument for judges.
- Provider names must produce unique slugs; onboarding must handle conflicts.
- We must not use `get_current_workspace_anonymous` for provider data (no membership check,
  #269).

## Validation
Accept when all of these pass as automated tests; otherwise switch to the fallback and
record a superseding ADR.
1. `POST /api/v1/providers` creates a workspace whose `owner` membership exists for the caller (Q4).
2. Provider A's token gets 403 on `/api/v1/{B-slug}/provider/listings` and `/bookings` (Q2).
3. A customer with no provider membership gets 403 on any `/{slug}/provider/...` route.
4. `/api/v1/default/provider/...` returns 404, because the default workspace has no
   `ProviderProfile`.
5. With `setActiveWorkspace('<A-slug>')`, a frontend call to `/provider/listings` through
   `configuredApiClient({ isWorkspaceScoped: true })` reaches `/api/v1/<A-slug>/provider/listings`.

Progress (2026-10-09): the marketplace seeder creates provider workspaces with
`create_with_owner` + `user_action.create_membership` inside `use_app_emitter(app)`; the
owner ends up with an `owner` membership (`test_seeded_provider_owner_has_owner_membership`).
Step 1 still needs the `POST /providers` endpoint and Q4 (hook alone, without the explicit
`create_membership`) is still open. Public reads (ADR 0009) only depend on the
`ProviderProfile` → workspace link and keep working under the fallback.

Progress (2026-10-09, M2 backend): steps 1–4 pass as automated tests in
`app/tests/api/api_v1/test_provider_area.py` (onboarding gives the caller an `owner` row;
another provider, a plain customer and an anonymous caller are refused on every
`/{slug}/provider/...` route; `/default/provider` is 404). The profile check
(`_provider_profile` in `app/api/deps.py`) is declared before the membership dependencies so
the default workspace answers 404, not 403. Q4 is answered from the source: the
`workspace-create-pre-commit` listener creates the owner membership; our explicit
`create_membership` is an idempotent backstop. Step 5 waits for the provider screens in
`frontend/`; the status moves to Accepted when it passes.
