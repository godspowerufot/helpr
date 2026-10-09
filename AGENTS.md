# AGENTS.md — Rules for coding agents working on Helpr

These rules are binding. If a rule blocks the task, stop and say so; do not work around it.

## 1. Read before you code

1. `docs/PROPOSAL.md` — what Helpr is, architecture, data model, API contracts.
2. `docs/MVP.md` — scope, user stories (IDs), Checkpoint 0, milestones, cut lines.
3. `docs/msflib-facts.md` — what MSFLib is known to provide, and at what evidence level.
4. `docs/adr/README.md` — decisions and their status.
5. `frontend/docs/IMPLEMENTATION_GUIDE.md` — the MSFLib React template's guide; binding for
   `frontend/` (until the frontend is regenerated, read it at
   `.reference/react-template/template/docs/IMPLEMENTATION_GUIDE.md`).
6. `docs/FRONTEND.md` — Helpr specifics on top of that guide: routes, workspace scoping,
   design language, tokens, and how the Vercel Web Interface Guidelines apply.
7. `frontend/AGENTS.md` — Next.js rules, before touching `frontend/`.

## 2. MSFLib verification rule (most important)

- Only use MSFLib classes, functions, routes, settings and events that appear in
  `docs/msflib-facts.md` at level `Verified (runtime)`, `Verified (code)` or `Documented`.
- If you need anything else: find it in the installed source (`backend/.venv/.../msflib/`) or
  the official docs (https://msflib.github.io/docsite/), then **add a row to
  `docs/msflib-facts.md` with its source before using it**.
- Frontend: the truth for an `@msflib/*` API is
  `frontend/node_modules/@msflib/<pkg>/dist/index.d.ts` (or the package source in
  `.reference/react/packages/`). The docs site has known errors (ADR 0016).
- Never invent an MSFLib method, parameter, endpoint or setting. Never rely on
  `backend/openwiki/docs/` alone; its examples do not match the code.
- When you run something that confirms or contradicts a fact, update its evidence level.
- Never edit MSFLib package code. Extend through the template's extension points.

## 3. Decision rule

- Do not build on an ADR whose status is `Proposed` or `Needs validation` without completing
  its validation steps first.
- If implementation contradicts an accepted ADR, stop and propose a superseding ADR. Do not
  silently diverge.
- Any new decision about data shape, security, module boundaries or MSFLib integration needs
  an ADR (template in `docs/adr/README.md`).

## 4. Scope rule

- Build only what `docs/MVP.md` lists for the current milestone. Do not add features from the
  "Later" column.
- **MSFLib stack only, both sides (ADR 0015, 0016).** Nothing outside the MSFLib templates.
  - Backend: only the modules the FastAPI template ships, plus `msflib-payments` (ADR 0019)
 and `msflib-notifications` (ADR 0021).
    `backend/pyproject.toml` differs from the template by that one line only.
  - Frontend: only the packages the React template installs (`@msflib/core`, `react-auth`,
    `react-components`, `react-shared`, `react-workspace`, `typescript`, plus MUI, Tailwind,
    TanStack Query, `react-toastify`). No optional `@msflib/react-*` modules, no other UI
    kits, state libraries, form libraries or HTTP clients.
- Payments go through `msflib-payments` with Paystack in **test mode** (ADR 0019). Never add
  live keys, never call Paystack directly, never build payouts; amounts sent to
  `process_payment` are kobo / 100.
- Activity notifications use `msflib-notifications`, in-app channel only (ADR 0021). Send them
  only through `app/services/notification.py` `notify_accounts`, after the business commit;
  never from lifecycle pre-commit hooks or the payment listener (dispatch commits).

## 5. Backend rules (`backend/`)

Where code goes:

| Kind | Location |
|---|---|
| SQLModel tables | `app/models/<feature>.py`, and **import them in `app/models/__init__.py`** |
| Action instances (`ModelAction`) | `app/actions/` |
| Business logic | `app/services/` |
| Request/response schemas | `app/schemas/` |
| Event listeners | `app/eventbus/`, registered in `app/bootstrap.py` on the app emitter |
| Routers | `app/api/api_v1/endpoints/<feature>.py`, included in `app/api/api_v1/api.py` |
| Tests | `app/tests/` mirroring the source path |

Rules:
- Every route declares its authorization dependency explicitly (public, customer, provider:
  see `docs/PROPOSAL.md` §6). No route relies on "the frontend will not call it".
- Provider routes are mounted at `/{workspace_slug}/provider/...` (slug first, to match the
  frontend's path workspace strategy) and use `user_deps` from `get_user_dependencies` plus
  `WorkspaceRoleCheck([UserType.owner, UserType.admin])`, and check that a `ProviderProfile`
  exists for the workspace (ADR 0005).
- Never return MSFLib `Account`, `Workspace` or `User` rows from Helpr endpoints; use our
  public response schemas.
- Never use `get_current_workspace_anonymous` for Helpr data (ADR 0009).
- Only `BookingService.transition()` changes `booking.status` (ADR 0007).
- Money is integer minor units plus a currency (ADR 0011).
- Register listeners on the app emitter (`bind_app_emitter(app)` in `main.py`), never on the
  module-level default emitter.
- Settings use flat environment variable names (the template subclasses settings).
- Never hard-code secrets; read them from `backend/.env`. Never commit `.env`.

Commands:
```bash
cd backend
poetry install
poetry run python -m app.initial_data      # WARNING: recreates tables (drops data)
poetry run python -m app.seed.runner --seeders marketplace --yes   # demo data; idempotent; needs SEED_ACCOUNT_PASSWORD
poetry run uvicorn app.main:app --reload    # http://localhost:8000/docs
poetry run pytest
poetry run ruff check app
```

## 6. Frontend rules (`frontend/`)

- The template guide (`frontend/docs/IMPLEMENTATION_GUIDE.md`) wins; `docs/FRONTEND.md` adds
  Helpr specifics. Run through the guide's §18 Definition of Done before reporting done.
- MSFLib first, MUI second, custom last: auth via `useAuth()` from `@msflib/react-auth`; HTTP
  via `configuredApiClient` from `@msflib/core`; forms via `FormBuilder`; tables via
  `TableWidget`; loading via `AppSkeleton`. Never write a local auth context, token handling
  or `fetch` wrapper.
- **Every API file passes `isWorkspaceScoped` explicitly**: `false` for public and customer
  endpoints, `true` for provider endpoints (`docs/FRONTEND.md` §3). The default is scoped.
- Static export: no `[id]` folders, no route handlers, no server data fetching. Use
  `view?id=` and `manage?id=`; `useSearchParams` inside `<Suspense>`.
- Design (ADR 0026): monochrome glass on every screen: swirl background, frosted glass cards
  and pills (`styles/glass.styles.ts`), ink for the one filled action, serif headings, Geist
  body. Tokens only (no hex, no Tailwind palette colours), typography classes only, one filled
  button per screen, no decoration.
  See `docs/FRONTEND.md` §7–§8.
- **Vercel Web Interface Guidelines are binding** for all UI code. Before reporting a frontend
  change as done, run the `web-design-guidelines` skill
  (`.agents/skills/web-design-guidelines/SKILL.md`) on the changed files and fix or justify
  every finding. Where a guideline needs a package outside the stack (`nuqs`, `virtua`), use
  the stack equivalent (`docs/FRONTEND.md` §7.3).
- `types/ → api/ → hooks/ → component`; `snake_case` data keys; `<entity>.<kind>.ts` names.
- Read `frontend/node_modules/next/dist/docs/` before using any Next.js API.
- Every screen implements loading, empty, error and success states and works at 360 px.
- Show `AppPaymentNotice` ("Test payments via Paystack…", ADR 0019) wherever payment appears.
- `NEXT_PUBLIC_USE_MOCK_API=true` serves every Helpr endpoint from `api/mock.api.ts`
  (data in `data/*.data.ts`); auth always hits the real backend. With it `false`, API files
 call `isMocked('<area>')` (`constant/app.constant.ts`): areas in `PENDING_BACKEND_AREAS`
 (routes the backend does not serve yet) stay on mocks; remove an area when its routes ship.
 Open the app at `http://localhost:3000` (backend CORS allows `localhost`, not `127.0.0.1`).
 Mocks keep the same types
  and the same ADR 0007 rules (409/403/422) as the backend.
- Never commit `.npmrc` with a token or `.env.local`.

Commands:
```bash
cd frontend
pnpm dev        # http://localhost:3000
pnpm lint
pnpm build
```

## 7. Testing rules

A change is not done until these pass for the area touched:
- Booking: every valid transition, every invalid transition (409), wrong actor (403).
- Provider routes: owner/admin pass; other provider, plain customer and anonymous fail.
- Reviews: only the booking's customer, only when `completed`, only once.
- Public routes: never expose draft/archived listings or non-public fields.
- Frontend: `pnpm lint` and `pnpm build` pass.

## 8. Local services

`docker compose up -d` at the repo root starts Redis (6379) and Mailpit (SMTP 1025, inbox at
http://localhost:8025). `docker compose --profile postgres up -d` adds Postgres.

## 9. Installing MSFLib

MSFLib installs from `github.com/msflib/fastapi` using the git credential configured for
`https://github.com/msflib` on this machine. Use Poetry 1.8.x (the template's version).
Resolution takes 10+ minutes; never run two installs at once. If installation fails with
"Repository not found", the credential is missing or expired: report it. Do not vendor,
re-implement or mock MSFLib.

Frontend packages come from GitHub Packages: `@msflib:registry=https://npm.pkg.github.com/`
and a `read:packages` token in `~/.npmrc` (or a git-ignored `frontend/.npmrc`). A 401/404 on
`pnpm install` means the token is missing or expired: report it. `.reference/` holds
read-only clones of `msflib/react-template`, `msflib/react` and `msflib/typescript` for
reading source; never import from it.
