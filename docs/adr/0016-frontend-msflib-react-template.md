# 0016. Frontend is built on the MSFLib React template and `@msflib/*` packages

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0003
- Depends on: ADR 0005, 0013, 0015; facts register "Frontend (MSFLib React)"

## Context
Hackathon rule: the product must make meaningful use of MSFLib on both sides, and use nothing
outside the MSFLib stack. ADR 0003 built a standalone Next.js app only because `@msflib/*`
packages were unreachable. That is no longer true: with the GitHub Packages token, the
template's packages resolve (`@msflib/core` 0.0.10, `react-auth` 0.0.22,
`react-components` 0.0.46, `react-shared` 0.0.7, `react-workspace` 0.0.14,
`typescript` 0.0.10). The template (`github.com/msflib/react-template`) ships a strict
implementation guide (`template/docs/IMPLEMENTATION_GUIDE.md`).

## Decision
- `frontend/` is regenerated from the MSFLib React template (`npx @msflib/react-template`,
  multi-tenant, `path` strategy). Its `docs/IMPLEMENTATION_GUIDE.md` is binding for
  `frontend/`; `docs/FRONTEND.md` only adds Helpr specifics on top of it.
- Stack is exactly the template's: Next.js App Router with `output: 'export'`, MUI,
  Tailwind 4, TanStack Query 5, `react-toastify`, Playwright, pnpm. No other UI, state or
  data libraries.
- MSFLib first: `@msflib/react-auth` (`AuthProvider`, `useAuth`) for login, sign-up, `/me`
  and logout; `@msflib/core` (`configureApplication`, `configuredApiClient`, `storage`,
  `setActiveWorkspace`) for config, HTTP and the active workspace;
  `@msflib/react-components` (`FormBuilder`, `TableWidget`, `AppSkeleton`) for every form,
  table and skeleton; `@msflib/react-shared` (`useActiveWorkspace`). MUI only where no
  MSFLib component fits.
- Only the packages the template installs are used. Optional modules (`react-notification`,
  `react-profile`, `react-support`, `react-certificate`, ...) are not added (ADR 0015 applies
  to the frontend too).
- Workspace scoping: `configureApplication({ apiClientDecorator: workspaceHookDecorator('path') })`.
  `AuthProvider` runs with `isWorkspaceScoped: false`. Public and customer API files use
  `configuredApiClient({ isWorkspaceScoped: false })`; provider API files use
  `configuredApiClient({ isWorkspaceScoped: true })`, so provider calls become
  `/api/v1/{workspace_slug}/provider/...` (ADR 0005).
- Routing follows the guide: no dynamic segments; `view?id=` and `manage?id=`.

## Alternatives considered
- Keep the standalone Next.js app (ADR 0003): rejected; violates the "MSFLib stack only"
  rule and duplicates what `react-auth`, `core` and `react-components` already provide.
- Header workspace strategy (`X-Workspace`): rejected; the backend template's documented
  resolver is `PathParameterResolver` (`workspace_slug` path parameter).

## Consequences
- The existing `frontend/` (custom `api/client.ts`, `useAuth`, login page) is replaced, not
  migrated. Nothing in it is worth keeping beyond the domain notes in `FRONTEND.md`.
- Static export: no server components fetching data, no route handlers, no middleware, no
  `[id]` folders. All data is client-side through TanStack Query.
- Installing requires `@msflib:registry=https://npm.pkg.github.com/` plus a token with
  `read:packages` in `~/.npmrc` or a git-ignored `frontend/.npmrc`. Never commit the token.
- Any `configuredApiClient()` call without `isWorkspaceScoped: false` registers its path as
  workspace-scoped (verified in `@msflib/core` source). Forgetting the flag on a customer
  call silently prefixes the active provider slug. Rule: always pass the flag explicitly.
- The docs site says `react-auth` logs out with `POST /logout`; the package source uses
  `DELETE`, which matches the backend. Trust the installed `dist/index.d.ts` and source,
  not the docs page.
