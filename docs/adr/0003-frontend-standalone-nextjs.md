# 0003. Frontend is a standalone Next.js app following MSFLib React conventions

- Status: Superseded by [ADR 0016](0016-frontend-msflib-react-template.md)
- Date: 2026-10-09
- Depends on: facts register "Access and installation" (npm packages)

## Context
The official frontend scaffold (`npx @msflib/react-template`) and every `@msflib/*` package
are published only to GitHub Packages, which we cannot access. The scaffold's documented
stack is Next.js App Router, Tailwind, MUI and TanStack Query, with a fixed folder layout.

## Decision
- `frontend/` is a Next.js 16 app created with `create-next-app`, using the same stack:
  Tailwind CSS 4, MUI, TanStack Query.
- We follow the scaffold's folder conventions (`app/` route groups `(public)`, `(auth)`,
  `(protected)`; `api/`, `hooks/`, `types/`, `components/`, `constant/`, `theme/`, ...).
- `frontend/api/client.ts` mirrors the documented `@msflib/typescript` client surface
  (`apiClient`, `apiFormDataClient`, `loginClient`, `ApiResponseError` with field errors),
  so we can swap to the real package without touching callers.

## Alternatives considered
- Wait for package access: rejected; it blocks all frontend work.
- A different stack (Vite SPA): rejected; diverges from MSFLib conventions and makes a later
  migration harder.

## Consequences
- We do not get `@msflib/react-components` (`FormBuilder`, tables, chat UI). We build the
  few components we need.
- Next.js 16 has breaking changes from earlier versions; agents must read
  `frontend/node_modules/next/dist/docs/` before using framework APIs (see
  `frontend/AGENTS.md`).
- If package access arrives, a new ADR decides whether to migrate.
