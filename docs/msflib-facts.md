# MSFLib Facts Register

This file separates what we **know** about MSFLib from what we **assume**. Coding agents
must only build on rows marked `Verified (code)` or `Documented`. Anything else must be
checked first, and this file updated with the result.

Last reviewed: 2026-10-09.

## Evidence levels

| Level | Meaning | Can we build on it? |
|---|---|---|
| Verified (runtime) | We ran it in this repository and observed the behaviour | Yes |
| Verified (code) | Read in the template source in `backend/` | Yes |
| Documented | Stated in the official docs at msflib.github.io/docsite, not yet run here | Yes, with a checkpoint test |
| Wiki only | Stated only in `backend/openwiki/docs/` (generated; examples do not match the code) | No; confirm elsewhere first |
| Assumption | Our inference; not stated anywhere | No; validate first |

## Access and installation

| Fact | Level | Impact |
|---|---|---|
| `github.com/msflib/fastapi` (the library source for every `msflib*` dependency) is reachable through a git credential helper scoped to `https://github.com/msflib` in the global git config. `git ls-remote` succeeds. | Verified (runtime) | `poetry install` can resolve MSFLib. First full install not yet confirmed. |
| Poetry 1.8.x is the template's expected version (Dockerfile pins 1.8.3 and uses `--no-dev`); we use 1.8.5 | Verified (code) | Do not use Poetry 2 commands in scripts |
| Dependency resolution is slow (10+ minutes): ~10 MSFLib git packages at different tags plus the AI stack | Verified (runtime) | Do not run concurrent installs |
| `@msflib/*` npm packages are on GitHub Packages (`@msflib:registry=https://npm.pkg.github.com/`) and resolve with the user's `read:packages` token: core 0.0.10, react-auth 0.0.22, react-components 0.0.46, react-shared 0.0.7, react-workspace 0.0.14, typescript 0.0.10 (`npm view`) | Verified (runtime) | Frontend uses the MSFLib React template (ADR 0016) |
| Repos `msflib/react-template`, `msflib/react`, `msflib/typescript` are readable (shallow copies in `.reference/`, read-only, git-ignored) | Verified (runtime) | Source of truth for frontend facts until `frontend/node_modules/@msflib` exists |

## Template structure (backend/)

| Fact | Level | Source |
|---|---|---|
| Template MSFLib packages: core, auth, account, workspaces, tenancy, ai-core, ai-api, documents, ingestion, knowledge. Helpr adds none (ADR 0015) | Verified (code) | `pyproject.toml` |
| API prefix is `/api/v1` (`settings.API_V1_STR`) | Verified (code) | `app/main.py`, tests |
| Settings: `AppSettings(WorkspaceSettings, TenancySettings, AccountSettings, AuthSettings, CoreSettings, SettingsBase)`; flat env names | Verified (code) | `app/core/config.py` |
| DB: SQLite when `USE_SQLITE=true`, else Postgres | Verified (code) | `app/db/session.py` |
| `deps.py` builds `get_session`, `get_keystore` (Redis, falls back to in-memory), and account dependencies: `get_current_account`, `get_current_account_or_none`, `get_current_active_account`, `get_current_active_superuser`, `RoleCheck` | Verified (code) | `app/api/deps.py` |
| Mounted routers: auth (prefix `""`), account (prefix `""`), profiles (`/profiles`), admin accounts (`/admin/accounts`) | Verified (code) | `app/api/api_v1/api.py` |
| Workspaces router is **not** mounted | Verified (code) | `app/api/api_v1/api.py` |
| One action instance per model in `app/actions`: `tenant_action`, `account_action`, `profile_action`, `workspace_action`, `user_action` | Verified (code) | `app/actions/__init__.py` |
| All table models must be imported in `app/models/__init__.py` (table creation and Alembic discover them there) | Verified (code) + Documented | `app/models/__init__.py`, `app/db/init_db.py` |
| App emitter is bound in `main.py`; workspace hooks registered in `bootstrap.py`; our listeners belong in `app/eventbus/` | Verified (code) | `app/main.py`, `app/bootstrap.py` |
| `python -m app.initial_data` creates tables, default tenant, superuser (role `admin`), default workspace and membership | Verified (code) | `app/db/init_db.py` |
| `user_action.get_by_all(session, account_id=, workspace_id=)` and `user_action.create_membership(...)` exist | Verified (code) | `app/db/init_db.py` |
| Celery app in `app/worker.py`; Redis broker when `REDIS_HOST` set, else `memory://` | Verified (code) | `app/worker.py` |
| No Alembic revisions exist | Verified (code) | `alembic/` |
| The app imports only `msflib` (core: `api`, `core`, `eventbus`, `seed`, `utils`), `msflib.auth`, `msflib.account`, `msflib.workspaces`, `msflib.tenancy`. Installing just those 5 packages (pinned tags from `pyproject.toml`) with pip into `.venv` runs the app; `pyproject.toml` stays unchanged | Verified (runtime) | `rg "from msflib" app`; boot 2026-10-09 |
| Backend boots; `initial_data` seeds; `/docs` 200; admin `POST /login` → token; `GET /me` → 200 | Verified (runtime) | Checkpoint 0.1, part of 0.2 |
| `.env-example`'s `SENTRY_DSN=https://${...}` placeholder fails settings validation; comment it out | Verified (runtime) | `msflib/core/config.py` |
| `ModelAction.get_by_all(session, **filters)` = read-only `select ... where col == value ... first()` | Verified (code) | `msflib/actions/base.py:131` |
| `tenant_action.ensure_default_tenant` and `workspace_action.ensure_default_workspace` are **get-or-create** (write); the default tenant is `slug == settings.DEFAULT_TENANT_SLUG` (`default`), the default workspace is `is_default == True` for that tenant | Verified (code) | `msflib/tenancy/actions.py:80`, `msflib/workspaces/actions.py:124` |
| `get_keystore` returns `RedisStore` only when **both** `REDIS_HOST` and `REDIS_PASSWORD` are set; otherwise in-memory `MapStore` (token revocation lost on restart). `StoreInterface`: `put(key, time, value)`, `get`, `check`, `remove` | Verified (code) + runtime (`/health` reports `memory`) | `msflib/api/deps.py:43`, `msflib/core/store.py` |
| `GET /api/v1/health` (Helpr, public) reports database, default tenant, default workspace and keystore; 503 when degraded | Verified (runtime) | `app/api/api_v1/endpoints/health.py`, `app/tests/api/api_v1/test_health.py` |

## Identity and auth

| Fact | Level | Source |
|---|---|---|
| `POST /api/v1/login` takes form fields `username` (email) and `password`; returns `access_token` | Verified (code) | `app/tests/api/api_v1/test_auth.py` |
| Login response also includes `expires`, `token_type`, `account`, `user` | Documented | auth module page |
| `GET /api/v1/me` returns the current account; `DELETE /api/v1/logout` revokes | Verified (code) | `test_auth.py` |
| Logout revokes **all** tokens of that account until the next login (revocation is per account, keyed by email) | Documented | auth module page, "Token revocation" |
| Open registration: `POST /api/v1/open` (account router mounted with prefix `""`), body `AccountCreatePublic` e.g. `{"email","password","profile":{"first_name"}}`, returns 201; 403 unless `USERS_OPEN_REGISTRATION=true` | Documented (path) + Verified (code) (prefix) | account module page; `api.py` |
| `PUT /api/v1/me`, `POST /api/v1/verify-availability` exist | Documented | account module page |
| Account creation sends a welcome email when emails are enabled (we run Mailpit on `localhost:1025`) | Documented | account module page |
| `AccountRole`: `root`, `admin`, `user`. `AccountStatus`: `online`, `active`, `suspended`, `banned` | Documented | account module page |
| `get_current_active_superuser` requires role `root` exactly (the template's first superuser is `admin`, so it fails this check) | Documented (#272) + Verified (code) | auth page; `init_db.py` |
| `RoleCheck` and `WorkspaceRoleCheck` are exact-match; list every allowed role | Documented + Verified (runtime) (`WorkspaceRoleCheck([owner, admin])`) | auth page; `test_provider_area.py` |
| Google OAuth settings (flat env): `ENABLE_GOOGLE_OAUTH`, `ALLOW_GOOGLE_OAUTH_SIGNUP`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; routes 403 when disabled (ADR 0029) | Verified (code) + Verified (runtime) | `msflib/auth/config.py`; `test_google_auth.py` |
| `GET /api/v1/google/login?redirect_uri=` redirects (302) to Google via authlib `authorize_redirect`, which stores the OAuth state in the Starlette session, so the app needs `SessionMiddleware` | Verified (runtime) | `msflib/auth/router.py`; curl 2026-10-09 |
| `POST /api/v1/google/callback {code, redirect_uri}` exchanges the code, returns the same Token shape as `/login` (`access_token`, `account`, …); an unknown email with signup allowed emits required event `google-account-create` (`msflib.auth.eventbus.events.EventName.GOOGLE_ACCOUNT_CREATE`) with `(GoogleUserInfo, {"session": session})` and fails if no listener is registered | Verified (code) + Verified (runtime) | `msflib/auth/router.py`; `test_google_auth.py` |
| Frontend: `GoogleAuthButton({apiBaseUrl, redirectUrl, onRedirect, googleLoginPath='/google/login', label, ...ButtonProps})` navigates to `{apiBaseUrl}/google/login?redirect_uri=`; `GoogleAuthHandler({apiBaseUrl, redirectUrl, onSuccess, onError, modalComponent})` reads `?code` and POSTs `{apiBaseUrl}/google/callback` | Verified (code) | `@msflib/react-components` `dist/index.d.ts` and source |
| `@msflib/react-auth` has no setter for an externally obtained token; its `login` stores `access_token` with `storage.setItem(getApplicationConfig().accessTokenKey, …)` (`@msflib/core`) then invalidates `authQueryKeys.me()` | Verified (code) | `@msflib/react-auth` source (`useAuth` login mutation) |

## Workspaces and tenancy

| Fact | Level | Source |
|---|---|---|
| `get_user_dependencies(UserModel=, WorkspaceModel=, session_dep=, account_dependencies=, workspace_resolver=)` returns `get_current_workspace`, `get_current_workspace_anonymous`, `get_current_user`, `get_current_active_user`, `WorkspaceRoleCheck` | Verified (runtime) | auth page; `app/api/deps.py` `user_deps`, `test_provider_area.py` |
| Default resolver is `PathParameterResolver()` reading path param `workspace_slug`; works for a router mounted at `/{workspace_slug}/provider` (Q6) | Verified (runtime) | auth page; `test_provider_area.py` |
| Resolution errors: unknown slug → 404 `Workspace not found`; caller not a member → 403 `User not found in specified workspace`; member with a role outside `WorkspaceRoleCheck` → 403 `Not authorized`; inactive account → 401 | Verified (code) + Verified (runtime) | `msflib/auth/deps.py:249,325,357`; `test_provider_area.py` |
| FastAPI resolves these sub-dependencies in parameter order, so a Helpr check declared first (the `ProviderProfile` lookup) answers before the membership checks: `/default/provider` is 404, not 403 | Verified (runtime) | `app/api/deps.py` `get_provider_context`; `test_provider_area.py` |
| `ModelAction.create(..., commit=False)` still flushes and emits `<model>-create-pre-commit`; the workspaces hook on `workspace-create-pre-commit` calls `user_action.create_membership(account_id=owner_id, workspace_id, owner_id, commit=False)`, so `create_with_owner` gives the owner a membership when the app emitter is bound (Q4). `create_membership` is idempotent | Verified (code) + Verified (runtime) | `msflib/actions/base.py:243,290`, `msflib/workspaces/eventbus/__init__.py:95-114`; `POST /providers` test |
| `get_current_workspace_anonymous` does **no** membership check (#269); only for deliberately public data | Documented | auth page |
| Membership (`workspace_user` row) is the only path into a workspace; types `owner`, `admin`, `member`, `guest`; statuses `active`, `kicked`, `banned` | Documented | workspaces page |
| On account creation (inside the app emitter), every new account is added as a **member of the default workspace**, owned by `FIRST_SUPERUSER`, and its `current_workspace_id` is set | Documented + Verified (code) (`test_workspace_hooks.py`) | workspaces page |
| Stock `POST /workspaces/` requires account role `admin`; use `workspace_action.create_with_owner(session, data=, owner=, tenant=)` for user-created workspaces | Documented | workspaces page |
| Workspace slug is unique and derived from the name | Documented | workspaces page |
| Default tenant must be seeded (done by `initial_data`); routers that fall back to tenant slug `default` 500 otherwise (#288) | Documented | workspaces page |

## Frontend (MSFLib React)

Sources: `.reference/react-template/template/` (template), `.reference/react/packages/*/src`
(package source at repo HEAD), `.reference/react/docs/packages/*.md` (docs). Re-check against
`frontend/node_modules/@msflib/<pkg>/dist/index.d.ts` once installed.

| Fact | Level | Source |
|---|---|---|
| Template stack: Next.js 16.2 App Router with `output: 'export'`, MUI 9, Tailwind 4, TanStack Query 5, `react-toastify`, Playwright, pnpm; packages `@msflib/core`, `react-auth`, `react-components`, `react-shared`, `react-workspace`, `typescript` | Verified (code) | `template/package.json`, `template/docs/IMPLEMENTATION_GUIDE.md` |
| Template rules: no `[id]` segments (`view?id=`, `manage?id=`), `<entity>.<kind>.ts` naming, tokens only from `theme/theme.css`, `FormBuilder` for all forms, `TableWidget` for all tables | Verified (code) | `IMPLEMENTATION_GUIDE.md` §2–§12 |
| `configureApplication({ baseURL, accessTokenKey, workspace?, endpoints?, apiClientDecorator?, wsHeaderName? })`; one-time call | Verified (code) | `core/src/types/config.types.ts`, `template/lib/application.config.ts` |
| `configuredApiClient(opts)` returns `apiClient`, `loginClient`, `apiFormDataClient`; every call registers its path as workspace-scoped **unless** `isWorkspaceScoped: false` | Verified (code) | `core/src/core/apiClient.ts`, `singleton.ts` |
| `apiClient(method, endpoint, body, options)` forwards `options.query` (`Record<string, string \| number \| boolean \| array>`); `buildQueryString` skips `undefined` and appends `?` | Verified (code) | `.reference/typescript/src/http.ts`; used by `react-students/src/api/students.api.ts` |
| `workspaceHookDecorator('path')` rewrites a scoped request `{baseURL}/x` to `{baseURL}/{activeWorkspace}/x` when a workspace is active; `'header'` sets `X-Workspace` instead | Verified (code) | `react-workspace/src/hooks/workspaceHookDecorators.ts` |
| `setActiveWorkspace(slug \| null)`, `getActiveWorkspace()`, `subscribeActiveWorkspace(listener) → unsubscribe` (module-level value; `setActiveWorkspace` is a no-op when unchanged); `useActiveWorkspace(): string \| null` re-renders on change. Used by the provider area gate | Verified (code) | `@msflib/core` `dist/core/index.d.ts`, `dist/chunk-BKCV7U7L.mjs`; `@msflib/react-shared` `dist/index.d.ts` |
| `storage.getItem/setItem/removeItem` (`StorageLike`, string values) — SSR-safe localStorage wrapper; `createStorage(adapter?)` | Verified (code) | `@msflib/core` `dist/storage/index.d.ts` |
| `AuthProvider options={{ isWorkspaceScoped }}`; `useAuth()` → `status`, `me`, `login`, `register`, `logout`, `updateMe`, `loading.*`; on mount calls `GET /me` | Documented | `react-auth.md` |
| `login` sends form-encoded `username` (from `email`) + `password` to `/login`; `register` → `POST /open` | Documented + Verified (code) | `react-auth.md`, `react-auth/src/api/auth.api.ts` |
| `logout` calls **`DELETE /logout`** (docs page wrongly says `POST`); matches the backend template | Verified (code) | `react-auth/src/api/auth.api.ts:99` |
| `AuthProvider` uses a fixed `me` query key; switching workspace does not refetch `/me` | Documented | `react-auth.md` |
| `FormBuilder` props: `elements`, `formData`, `setFormData`, `onSubmit(data, reset)`, `loadingState`, `layout`; `eType` includes `text`, `email`, `password`, `number`, `date`, `datetime`, `textarea`, `select`, `checkbox`, `switch`, `upload`, `button` | Documented | `react-components.md` |
| `TableWidget` props: `rows`, `columns`, `loading`, `enableSearch`, `menuItem` + `menuItems` + `handleMenuClick`, `onRowClick`, `styles` | Documented | `react-components.md` |
| `@msflib/react-components@0.0.46` depends on `@mui/material ^9.2.0`, but the template pins `@mui/material 9.0.0`. Two copies get installed; MUI 9.5 transitions inside `FormBuilder` (password visibility toggle, select menus) read `theme.motion.reducedMotion` from the app's 9.0 theme and throw `Cannot read properties of undefined (reading 'reducedMotion')`. Fix: pin the app's `@mui/material` and `@mui/material-nextjs` to the version `react-components` resolves (9.5.0) so one copy exists | Verified (runtime) | `react-components/package.json`; `/register` crash 2026-10-09, gone after pinning 9.5.0 |
| `FormBuilder` adds a show/hide eye icon to every `eType: 'password'` field and always uses its own toggle handler (`mData.endIcon.clickBehavior` is ignored for passwords). The handler calls `InputIcon`'s `setCurrentKey` inside a `setElementType` updater, so React logs `Cannot update a component (InputIcon) while rendering a different component (Controller)` on the first click. Dev-only warning: the toggle, validation and submit still work. The eye button also has an empty `aria-label` until it is first clicked. Upstream defect; not patchable from Helpr (no editing package code) | Verified (runtime) | `react-components/src/components/formbuilder/renders.tsx` `passwordHandler`; reproduced on `/register` 2026-10-09 |
| `FormBuilder` text fields: `mData.inputProps` is applied to the MUI input slot, but the same key is also spread onto `TextField`, which no longer accepts `inputProps` in MUI 9, so React warns `React does not recognize the inputProps prop on a DOM element`. `mData` is typed and has no `autoComplete` key, so there is no clean way to set input attributes such as `autocomplete` or `enterkeyhint` through `FormBuilder`. Helpr leaves them unset | Verified (runtime) | `react-components/src/components/formbuilder/renders.tsx` `RenderTextField`, `types.ts` `FormElement.mData`; `/services` 2026-10-09 |

## Seeding and accounts (runtime findings)

| Fact | Level | Source |
|---|---|---|
| `python -m app.seed.runner --seeders <name> --yes` runs one seeder from `app/seed/seeders.yml`; custom classes via `seeder_class` (subclass `msflib.seed.base.SeederBase`); records from `app/seed/data/*.json` must be a list of objects; `${VAR}` placeholders resolve from env (`.env` loaded) and raise if unset; the runner does not commit | Verified (runtime) | `msflib/seed/{cli,runner,utils}.py`; marketplace seed 2026-10-09 |
| The template's `account_action` has no `profile_action`, so `account_action.create(data=AccountCreate(profile=...))` silently creates **no** `Profile`; create it with `profile_action.create(session, data=ProfileCreate(...), update={"id": account.id})` (`Profile.id` = `account.id`) | Verified (runtime) | `msflib/account/actions.py:83`; seeded accounts had no profile until fixed |
| `workspace_action.create_with_owner(session, data=WorkspaceCreate(name, slug, description, owner_id, status), owner=, tenant=)` + `user_action.create_membership(...)` leaves the owner with `UserType.owner` | Verified (runtime) | `app/tests/api/api_v1/test_marketplace.py` |

## Payments (`msflib-payments`, tag `payments-v0.2.1`, ADR 0019)

| Fact | Level | Source |
|---|---|---|
| Installs from `modules/payments`; depends on `stripe ^13.2` and `msflib` core `core-v0.2.1` (same core as the template) | Verified (runtime) | `pip install` 2026-10-09, `pyproject.toml` of the module |
| `PaymentsSettings` (namespace `PAYMENTS`) accepts flat env names `PAYMENT_GATEWAY`, `PAYMENT_CALLBACK_URL`, `PAYMENT_CANCEL_URL`, `PAYSTACK_BASE_URL`, `PAYSTACK_SECRET_KEY`, `STRIPE_SECRET_KEY`; mixed into `AppSettings`, read with `settings.scope("PAYMENTS")` | Verified (runtime) | `msflib/payments/config.py`; scope read 2026-10-09 |
| Tables `payment` (`account_id`, `email`, `description`, `amount` float major units, `callback_url`, `data` JSON, `authorization_url`, `access_code`, `reference`, `status`, `gateway`) and `paymentqueue` (`payment_id`, `entity_id`, `event_key`, `data`, `status` queued/processed) | Verified (runtime) | `models/payment.py`, `models/payment_queue.py`; created with `create_all` 2026-10-09 |
| `PaymentStatus`: `verified`, `unverified`, `failed`, `fulfilled` | Verified (code) | `models/payment.py` |
| `router(get_session, get_current_account, settings, prefix="/payments", tags)` gives `GET /payments/verify/{reference}` and `GET /payments/{payment_id}`; both require auth (401 anonymous) and only return the caller's payments (404 otherwise) | Verified (runtime) | `router.py`; curl 2026-10-09 |
| `await process_payment(session, payment_data=PaymentData(email, amount, gateway, description, callback_url, cancel_url), account, settings, queue_event_key, queue_data, metadata=None)` initiates with the gateway, stores `Payment` + `PaymentQueue`; does not commit | Verified (code) | `service/processor.py` |
| Verify rejects when `gateway.convert_amount(payment.amount) != transaction.amount` (400 "Payment amount mismatch.") | Verified (code) | `router.py:169` |
| After verify the router calls `emitter.emit_required_async("payment-queue-execute-{event_key}", queue, {"session": session})`; missing listener → 500 on an already-verified payment. `emitter` is the request's app emitter (`bind_app_emitter` middleware), so listeners go on the app emitter | Verified (code) | `router.py:80`, `msflib/eventbus/base.py` (`EmitterProxy`, `bind_app_emitter`) |
| No payouts: no Paystack transfers, subaccounts, splits, webhooks or refunds | Verified (code) | whole module source |
| End to end: `POST /bookings/{id}/pay` → `process_payment` returns a Paystack test `authorization_url`; `GET /payments/verify/{reference}` runs our `payment-queue-execute-booking-payment` listener (booking `accepted` → `paid`), then marks the queue `processed` and commits. A verified payment whose queue is still `queued` re-runs the listener without calling Paystack | Verified (runtime) | `test_bookings.py`; live checkout 2026-10-09 |
| `PaymentProcessor` always constructs `StripeGateway` too (needs `stripe` importable even for Paystack) | Verified (code) | `service/processor.py:30` |

## Notifications (msflib-notifications `notifications-v0.2.1`, in-app only, ADR 0021)

| Fact | Level | Source |
|---|---|---|
| Installs from `modules/notifications` at tag `notifications-v0.2.1`; depends on core, account, tenancy (already installed) and Jinja2; Twilio is optional | Verified (runtime) | `pip install --no-deps`, app imports |
| `NotificationSettings` (namespace `NOTIFICATIONS`, flat `DASHBOARD_PATH`) is mixed into `AppSettings` | Verified (runtime) | `app/core/config.py`, app boots |
| Tables `notification` (`title`, `message`, `channels`, `sender_id`, `notification_type` `system`/`admin`, `scope`) and `accountnotification` (`receiver_id`, `notification_id`, `is_read`) | Verified (runtime) | `msflib/notifications/models.py`, `create_all` |
| `dispatch_account_notifications(session=, settings=, data=NotificationCreate(title, message, channels), n_type=, receivers=, sender=None)`; `inapp` must be in `channels` for anything to be stored; `sender` is required unless `n_type` is `system` | Verified (runtime) | `service/notification.py`, `test_notifications.py` |
| Dispatch **commits** (`save_for_recipients`), so it is called only after the business commit | Verified (code) | `service/notification.py` |
| `account_notification_router(get_session=, get_current_account=, prefix=, tags=)` gives `GET /` (`offset`, `limit`), `GET /{id}`, `PATCH /{id}/mark?status=`, `PATCH /mark-all?status=`, `DELETE /{id}`; all need login and only see the caller's rows (another account's id → 404) | Verified (runtime) | `test_notifications.py`, curl against `/api/v1/notifications/` |
| Response item is `AccountNotificationRead` {`id`, `receiver_id`, `notification_id`, `is_read`, `notification`: {`title`, `message`, `channels`, `notification_type`, …}, `created_at`, `updated_at`} | Verified (runtime) | curl |
| `Notification` has no link or metadata column. `NotificationCreate` is only `title`, `message`, `channels`. Dispatch sets `scope` to `"account"` itself, so a destination cannot be stored except inside `message` (ADR 0031) | Verified (code) | `models/notification.py`, `service/notification.py` `update_data` |
| SMS needs `TWILIO_*` fields declared on our settings class (#274); not used | Documented | notifications page |

## File uploads (`msflib.utils.uploads`, core; ADR 0027)

| Fact | Level | Source |
|---|---|---|
| `save_file_blob(file: UploadFile, parent_folder, storage_bucket, filename, settings, storage_method=StorageMethod.file) -> StorageBlob` (`url`, `storage_method`, `parent_folder`, `storage_bucket`, `filename`, `content_type`, `size_bytes`, `etag`); `save_file(...)` is the same returning only the URL string (used by `account/service/profile.py` `update_profile_avatar`) | Verified (code) | `msflib/utils/uploads.py` |
| `validate_upload(file, max_bytes=, allowed_content_types=, allowed_content_prefixes=)` raises 413 (too big) / 415 (type); the type check reads the **client-sent** `content_type` only | Verified (code) | `msflib/utils/uploads.py` |
| `delete_blob(blob, settings)` removes the stored file (local: `os.remove`), 501 if the backend cannot delete | Verified (code) | `msflib/utils/uploads.py` |
| `LocalStorage` (method `file`) writes to `{cwd}/{CORE STORAGE_PATH}/{parent_folder}/{storage_bucket}/{filename}` (paths that escape the root → 400) and returns the URL `{STORAGE_BASE_URL}/{parent}/{bucket}/{filename}`; core defaults `STORAGE_METHOD=file`, `STORAGE_BASE_URL=/uploads`, `STORAGE_PATH=uploads` (our config: `./uploads`) | Verified (code) | `msflib/utils/uploads.py`, `msflib/core/config.py:1095`, `app/core/config.py` |
| The template's `main.py` mounts `StaticFiles(directory=STORAGE_PATH)` at `STORAGE_BASE_URL` when `STORAGE_METHOD == "file"`, so stored files are served from the API origin (not under `/api/v1`) | Verified (code) | `app/main.py` |
| Frontend: `configuredApiClient(...).apiFormDataClient(method, endpoint, formData, options?)` sends multipart bodies (no `Content-Type`, so the browser sets the boundary) with the same token and `isWorkspaceScoped` endpoint resolution as `apiClient` | Verified (code) | `@msflib/typescript` `dist/index.d.ts:69`, `@msflib/core` `dist/chunk-BKCV7U7L.mjs:181` |
| `FormBuilder` `mData.isCustomLabel: true` renders the label as a free-standing `<h1 style={label_style}>` above the control and passes `label=""` to the MUI `TextField`, so the input has **no accessible name** and screen readers announce extra level-1 headings. Without it, the MUI floating `label` is used (associated via `id`). `radio` always adds its own `FormLabel` (hard-coded id), so a custom label on a radio shows the text twice. Helpr leaves `isCustomLabel` off (`baseMData`) and raises MUI labels through theme defaults (`MuiInputLabel` `shrink`, `MuiOutlinedInput` `notched`); every field then has a linked name | Verified (code + runtime snapshot 2026-10-09) | `react-components` `dist/chunk-DK55VH5X.mjs` `FormField`, `RenderTextField`, `RenderRadioButton` |
| `FormBuilder` `eType: 'select'` renders a plain text `TextField` unless `mData.select: true` (or `dType: 'list'`, which `getMetaData` maps to `select: true`); options are passed as `MenuItem` children either way | Verified (code + runtime 2026-10-09) | `react-components` `dist/chunk-DK55VH5X.mjs` `renderInput`, `getMetaData` |
| Frontend: `asFormData(object)` from `@msflib/typescript` appends `File` values as files, arrays item by item, other objects as JSON strings, and skips `null`/`undefined` | Verified (code) | `@msflib/typescript` `dist/index.mjs:52` |
| Frontend: `apiClient` and `apiFormDataClient` always `return response.json()`; non-2xx throws `ApiResponseError` first. A 204/empty body therefore rejects with a parse error, so Helpr routes the frontend calls return JSON bodies, never 204 | Verified (code) | `@msflib/typescript` `dist/index.mjs:225-271` |
| `FormBuilder` `eType: 'upload'` renders a `Button component="label"` with a hidden `<input type="file" accept={mData.accept}>`; the field value is a `File[]` that **accumulates** across picks; `mData.preview_upload` (default `true`) shows `<img alt="File preview">` thumbnails kept in internal state (remount the form to clear them). The renderer gets no `error`, so `validation` messages on an upload never show: check for a file in `onSubmit` and render the message yourself. `mData` is spread onto the MUI `Button`, so a boolean `preview_upload` reaches the DOM and React warns ("non-boolean attribute"); pass `preview_upload: undefined` (typed `boolean | undefined`; the explicit key still overrides the `true` default) to turn the preview off without the warning | Verified (code + runtime) | `react-components` `dist/chunk-DK55VH5X.mjs` `RenderUpload`, `getMetaData` |

## Open questions (Assumptions to validate)

| # | Question | Why it matters | How to validate |
|---|---|---|---|
| Q1 | Can a customer browse public listings with no provider-workspace membership? | Public marketplace | Call our public listing endpoints with no token and with a fresh customer token (Checkpoint 0) |
| Q2 | Can provider isolation rely on `get_user_dependencies` + `WorkspaceRoleCheck` without our own membership table? | ADR 0005 | **Answered: yes** (`test_provider_area.py`, provider A → 403 on B's listing and booking routes) |
| Q3 | Does the frontend authenticate against the backend with the documented pattern (form login, bearer token, CORS)? | Integration | Log in from `frontend/` at `localhost:3000`, load `/me` |
| Q4 | Does `workspace_action.create_with_owner` also create the owner membership (via the `workspace-create-pre-commit` hook) when called from our endpoint? | Provider onboarding | **Answered: yes** when the app emitter is bound (hook in `msflib/workspaces/eventbus/__init__.py`); we also call `create_membership` (idempotent) |
| Q5 | Do our own `ModelAction` subclasses emit `<model>-create-pre-commit` events we can listen to? | Future side effects (none required by the MVP) | Register a listener in a test |
| Q6 | Does a router mounted at `/{workspace_slug}/provider` resolve the workspace through `PathParameterResolver` and enforce membership? | ADR 0005, 0016 (frontend path strategy) | **Answered: yes** (backend side, `test_provider_area.py`); the frontend half is ADR 0005 step 5 |
| Q7 | Does `useAuth().register` send a body `/open` accepts (`profile.first_name` vs `profile.firstname`)? | Sign-up (C3) | Checkpoint 0.3: register through the UI, expect 201 |
