# Helpr — How MSFLib Is Used, End to End

Diagrams of every place MSFLib does real work in Helpr: frontend, backend, payments,
notifications and uploads. Each section lists the files it was drawn from. MSFLib APIs shown
here are the ones recorded in [`msflib-facts.md`](msflib-facts.md); if code and this file
disagree, the code and the facts register win, so update this file.

Last reviewed: 2026-10-09.

## 1. The whole picture

Which MSFLib package does what, on each side, and how they meet.

```mermaid
flowchart LR
  subgraph FE["frontend/ (MSFLib React template, static Next.js export)"]
    direction TB
    PAGES["Helpr pages<br/>public, customer, provider"]
    CFG["@msflib/core<br/>configureApplication, configuredApiClient,<br/>storage, setActiveWorkspace"]
    AUTHFE["@msflib/react-auth<br/>AuthProvider, useAuth"]
    WSFE["@msflib/react-workspace<br/>workspaceHookDecorator('path')"]
    SHARED["@msflib/react-shared<br/>useActiveWorkspace"]
    COMP["@msflib/react-components<br/>FormBuilder, TableWidget, AppSkeleton,<br/>GoogleAuthButton, GoogleAuthHandler"]
    PAGES --> AUTHFE & COMP & SHARED & CFG
    CFG --> WSFE
  end

  subgraph BE["backend/ (MSFLib FastAPI template, /api/v1)"]
    direction TB
    HELPR["Helpr routes and services<br/>listings, bookings, providers, reviews"]
    AUTHBE["msflib.auth + msflib.account<br/>/login /logout /open /me /profiles /google"]
    WSBE["msflib.workspaces + msflib.tenancy<br/>workspace_action, user_action,<br/>get_user_dependencies, WorkspaceRoleCheck"]
    PAY["msflib-payments<br/>process_payment, /payments/verify"]
    NOTIF["msflib-notifications<br/>dispatch_account_notifications, /notifications"]
    CORE["msflib core<br/>ModelBase, AppEmitter, seed, uploads"]
    HELPR --> WSBE & PAY & NOTIF & CORE
  end

  FE -- "Bearer JWT + JSON" --> BE
  PAY -- "initialize / verify (test mode)" --> PS["Paystack"]
  AUTHBE -- "code exchange" --> G["Google OAuth"]
  AUTHBE -- "welcome email" --> MAIL["Mailpit (dev SMTP)"]
```

| Concern | Frontend (MSFLib) | Backend (MSFLib) | Helpr owns |
|---|---|---|---|
| Sign-up, login, session | `AuthProvider`, `useAuth` | `auth_router`, `account_router` | Form definitions |
| Google sign-in | `GoogleAuthButton`, `GoogleAuthHandler` | `/google/login`, `/google/callback` | `create_google_account` listener |
| Provider isolation | `workspaceHookDecorator('path')`, `setActiveWorkspace`, `useActiveWorkspace` | `get_user_dependencies`, `WorkspaceRoleCheck` | `ProviderProfile`, `get_provider_context` |
| Forms, tables, loading | `FormBuilder`, `TableWidget`, `AppSkeleton` | — | Form definitions and layouts |
| Payments | `configuredApiClient` (calls `/payments/verify`) | `process_payment`, `payments_router` | `start_payment`, `on_payment_verified` |
| Notifications | `configuredApiClient` (calls `/notifications`) | `dispatch_account_notifications`, `account_notification_router` | `notify_accounts`, `notify_after_commit` |
| Photos | — | `validate_upload`, `save_file_blob` | `provider_photo` service |
| Bookings, listings, reviews | — | `ModelBase` only | Everything else |

## 2. Startup: how each side wires MSFLib in

### 2.1 Frontend

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant Providers as app/Provider.tsx
  participant Config as lib/application.config.ts
  participant Core as @msflib/core
  participant Auth as @msflib/react-auth
  participant API as Backend /api/v1

  Browser->>Providers: load any page
  Providers->>Config: initMsflib()
  Config->>Core: configureApplication(baseURL, accessTokenKey, apiClientDecorator, register endpoint '/open')
  Note over Config,Core: apiClientDecorator = workspaceHookDecorator('path')<br/>unless NEXT_PUBLIC_WORKSPACE_MODE=single
  Providers->>Auth: AuthProvider with isWorkspaceScoped = false
  Auth->>API: GET /me (token from storage)
  API-->>Auth: account or 401
  Auth-->>Providers: useAuth().status = authenticated or unauthenticated
```

Files: `frontend/app/Provider.tsx`, `frontend/lib/application.config.ts`,
`frontend/utils/resolveWorkspace.ts`.

### 2.2 Backend

```mermaid
flowchart TB
  MAIN["app/main.py<br/>FastAPI app"] -->|"bind_app_emitter(app)"| EMIT["MSFLib AppEmitter<br/>(one per app)"]
  BOOT["app/bootstrap.py"] -->|"msflib.workspaces.eventbus.register_event_hooks"| EMIT
  LIS["app/eventbus/__init__.py<br/>register_helpr_listeners"] -->|"payment-queue-execute-booking-payment<br/>to on_payment_verified"| EMIT
  LIS -->|"google-account-create<br/>to create_google_account"| EMIT

  CONF["app/core/config.py AppSettings"] -->|"mixes in"| SET["WorkspaceSettings, TenancySettings,<br/>AccountSettings, AuthSettings, CoreSettings,<br/>PaymentsSettings, NotificationSettings"]

  DEPS["app/api/deps.py"] -->|"get_session_factory, get_keystore_factory"| SESS["get_session, get_keystore"]
  DEPS -->|"get_account_dependencies"| ACC["get_current_account,<br/>get_current_active_account, RoleCheck"]
  DEPS -->|"get_user_dependencies"| USR["user_deps: get_current_workspace,<br/>get_current_active_user, WorkspaceRoleCheck"]

  API["app/api/api_v1/api.py"] -->|"mounts MSFLib routers"| R1["auth_router, account_router,<br/>profile_router, payments_router,<br/>account_notification_router"]
  API -->|"mounts Helpr routers"| R2["/health /categories /listings /providers<br/>/map /bookings /{workspace_slug}/provider"]
```

Listeners go on the **app** emitter, never the module-level default one (AGENTS.md §5).
The provider router is mounted last so `/{workspace_slug}` does not shadow fixed paths.

## 3. Sign-up, login, logout

All three are MSFLib on both ends; Helpr only supplies the form definitions and layouts.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Form as FormBuilder (react-components)
  participant Auth as useAuth (react-auth)
  participant Store as storage (@msflib/core)
  participant BE as MSFLib auth + account routers
  participant WS as MSFLib workspaces hook
  participant Mail as Mailpit

  User->>Form: fill sign-up form (/register)
  Form->>Auth: register(email, password, profile.first_name, profile.last_name)
  Auth->>BE: POST /open
  BE->>WS: account created (app emitter)
  WS-->>BE: add as member of default workspace
  BE->>Mail: welcome email
  BE-->>Auth: 201

  User->>Form: fill login form (/login)
  Form->>Auth: login(email, password)
  Auth->>BE: POST /login (form-encoded username + password)
  BE-->>Auth: access_token, token_type, account, user
  Auth->>Store: save token under accessTokenKey
  Auth->>BE: GET /me (Bearer)
  BE-->>Auth: current account

  User->>Auth: logout()
  Auth->>BE: DELETE /logout
  BE-->>Auth: all tokens of this account revoked
  Auth->>Store: remove token
```

Files: `frontend/app/(auth)/login/components/Login.tsx`,
`frontend/app/(auth)/register/components/SignUp.tsx`, their `data/form/*.form.ts` and
`*.layout.tsx` files.

### 3.1 Google sign-in (ADR 0029)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant BTN as GoogleAuthButton (react-components)
  participant BE as MSFLib auth router
  participant G as Google
  participant H as GoogleAuthHandler (react-components)
  participant EM as App emitter
  participant L as create_google_account (Helpr)

  User->>BTN: Continue with Google
  BTN->>BE: GET /google/login?redirect_uri=...
  BE-->>User: 302 to Google (OAuth state in session)
  User->>G: choose account
  G-->>H: redirect back to the login page with ?code
  H->>BE: POST /google/callback (code, redirect_uri)
  BE->>G: exchange code for user info
  alt email unknown and signup allowed
    BE->>EM: emit required google-account-create (GoogleUserInfo, session)
    EM->>L: create_google_account
    L->>L: account_action.create(email, random unused password)
    L->>EM: emit ACCOUNT_CREATED (default-workspace membership)
  end
  BE-->>H: same Token shape as /login
  H->>H: store token, invalidate authQueryKeys, go to ?next or /services
```

Settings: `ENABLE_GOOGLE_OAUTH`, `ALLOW_GOOGLE_OAUTH_SIGNUP`, `GOOGLE_OAUTH_CLIENT_ID`,
`GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; the routes are 403 when disabled.

Files: `backend/app/services/google_auth.py`, `backend/app/eventbus/__init__.py`,
`frontend/app/(auth)/components/GoogleLoginButton.tsx`,
`frontend/app/(auth)/login/components/GoogleCallback.tsx`.

## 4. Becoming a provider (workspace creation)

A provider is an MSFLib **workspace** that has a Helpr `ProviderProfile` (ADR 0005).

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as ProviderOnboard (FormBuilder)
  participant R as POST /providers (Helpr)
  participant S as provider.create_provider (Helpr)
  participant T as tenant_action (MSFLib)
  participant W as workspace_action (MSFLib)
  participant H as workspace-create-pre-commit hook (MSFLib)
  participant U as user_action (MSFLib)
  participant DB as Database

  Customer->>FE: business name, bio, area, phone, location
  FE->>R: POST /providers (isWorkspaceScoped false)
  R->>S: create_provider(account, data)
  S->>W: get_by_all(slug), 409 if taken
  S->>T: ensure_default_tenant()
  S->>W: create_with_owner(WorkspaceCreate, owner, tenant, commit=False)
  W->>H: emit workspace-create-pre-commit
  H->>U: create_membership(owner, type owner)
  S->>U: create_membership(...) again, idempotent safety net
  S->>DB: add ProviderProfile(workspace_id, ...)
  S->>DB: commit
  R-->>FE: 201 ProviderMine with workspace_slug
```

Files: `backend/app/services/provider.py`,
`frontend/app/(protected)/provider/onboard/components/ProviderOnboard.tsx`.

## 5. Provider area: workspace scoping across both sides

The frontend never writes the slug into URLs. It marks the provider client as scoped and
MSFLib inserts the active slug; the backend resolves the same slug and checks membership.

```mermaid
sequenceDiagram
  autonumber
  participant Gate as ProviderGate.tsx
  participant Core as @msflib/core
  participant Api as provider-workspace.api.ts
  participant Dec as workspaceHookDecorator('path')
  participant EP as Provider endpoint
  participant Dep as get_provider_context (Helpr)
  participant UD as user_deps (MSFLib)

  Gate->>Gate: useMyProviders() calls GET /providers/mine
  Gate->>Core: setActiveWorkspace('bolas-cleaning')
  Note over Gate: useActiveWorkspace() renders children<br/>once the slug is active
  Api->>Dec: GET /provider/bookings (isWorkspaceScoped true)
  Dec->>EP: GET /api/v1/bolas-cleaning/provider/bookings
  EP->>Dep: resolve dependencies
  Dep->>UD: get_current_workspace (PathParameterResolver reads workspace_slug)
  alt unknown slug
    UD-->>EP: 404 Workspace not found
  else no ProviderProfile, e.g. default
    Dep-->>EP: 404 Provider not found
  else caller not a member
    UD-->>EP: 403 User not found in specified workspace
  else member but not owner or admin
    UD-->>EP: 403 Not authorized (WorkspaceRoleCheck)
  else owner or admin
    Dep-->>EP: ProviderContext(account, workspace, profile)
    EP-->>Api: 200, bookings of this workspace only
  end
  Gate->>Core: on unmount setActiveWorkspace(null)
```

Only `provider-workspace.api.ts` is scoped. Every other API file passes
`isWorkspaceScoped: false`, so customer calls never get a slug.

```mermaid
flowchart LR
  subgraph scoped["isWorkspaceScoped: true"]
    PW["provider-workspace.api.ts<br/>/provider/..."]
  end
  subgraph unscoped["isWorkspaceScoped: false"]
    L["listing.api.ts"]
    C["category.api.ts"]
    P["provider.api.ts"]
    B["booking.api.ts"]
    PAYA["payment.api.ts"]
    N["notification.api.ts"]
    M["map.api.ts"]
    AU["AuthProvider"]
  end
  PW -->|"/{slug}/provider/..."| BE["/api/v1"]
  L & C & P & B & PAYA & N & M & AU -->|"path unchanged"| BE
```

Files: `frontend/app/(protected)/provider/components/ProviderGate.tsx`,
`frontend/api/*.api.ts`, `backend/app/api/deps.py`,
`backend/app/api/api_v1/endpoints/provider_area.py`.

## 6. Booking lifecycle (Helpr) and where MSFLib plugs in

Only `BookingService.transition()` changes `booking.status` (ADR 0007). The `paid` step is
driven by msflib-payments; every arrow that says "notify" goes through msflib-notifications.

```mermaid
stateDiagram-v2
  [*] --> requested: customer POST /bookings, notify provider
  requested --> accepted: provider accept, notify customer
  requested --> declined: provider decline, notify customer
  requested --> cancelled: customer cancel, notify provider
  accepted --> paid: msflib-payments verify, on_payment_verified, notify provider
  accepted --> cancelled: customer or provider, reason required
  paid --> completed: provider complete, notify customer
  completed --> [*]: customer may review once, notify provider
  declined --> [*]
  cancelled --> [*]
```

Invalid moves are 409, the wrong actor is 403. File: `backend/app/services/booking.py`.

## 7. Payment, end to end (msflib-payments + Paystack test mode)

### 7.1 Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant BV as BookingView.tsx
  participant BR as POST /bookings/{id}/pay (Helpr)
  participant BS as start_payment (Helpr)
  participant PP as process_payment (msflib-payments)
  participant PS as Paystack (test)
  participant PR as PaymentReturn.tsx
  participant VR as GET /payments/verify/{ref} (msflib-payments)
  participant EM as App emitter
  participant L as on_payment_verified (Helpr)
  participant N as notify_after_commit (Helpr)

  Customer->>BV: Pay (booking is accepted)
  BV->>BR: booking.api.ts pay(id), isWorkspaceScoped false
  BR->>BS: start_payment(session, id, account)
  BS->>BS: customer's booking? (403) accepted? (409) PAYSTACK_SECRET_KEY set? (503)
  BS->>PP: process_payment(PaymentData(email, amount = kobo / 100, gateway paystack), queue_event_key booking-payment, queue_data booking_id)
  PP->>PS: initialize transaction
  PS-->>PP: authorization_url, access_code, reference
  PP-->>BS: Payment + PaymentQueue (queued), not committed
  BS->>BS: booking.payment_id = payment.id, commit
  BR-->>BV: PaymentCheckout(payment_id, reference, authorization_url)
  BV->>PS: window.location.assign(authorization_url)

  Customer->>PS: pay with a test card
  PS-->>PR: redirect to PAYMENT_CALLBACK_URL /bookings/payment?reference=...
  PR->>VR: payment.api.ts verify(reference), Bearer token
  VR->>PS: verify transaction
  PS-->>VR: status, amount
  VR->>VR: amount mismatch gives 400, else Payment.status = verified
  VR->>EM: emit_required_async payment-queue-execute-booking-payment (queue, session)
  EM->>L: on_payment_verified(queue, session)
  L->>L: BookingService.transition(accepted to paid), no commit
  L->>N: queue "Booking paid" for provider owner and admins
  VR->>VR: queue.status = processed, commit
  N-->>N: after_commit, dispatch in a fresh session
  VR-->>PR: PaymentRead(status, reference, data.booking_id)
  PR-->>Customer: Payment received, failed, or still processing
```

### 7.2 Rules this flow enforces

| Rule | Where |
|---|---|
| Only the booking's customer can pay | `get_customer_booking` → 403 |
| Only an `accepted` booking can be paid | `start_payment` → 409 |
| Payments must be configured | `start_payment` → 503 |
| Paystack initiation failure rolls back | `start_payment` → 502 |
| Amounts go to `process_payment` in major units (kobo / 100) | `start_payment` |
| Paystack amount must match the stored amount | msflib-payments verify → 400 |
| Only the paying account can verify or read a payment | msflib-payments router → 401 / 404 |
| The listener must not commit; the verify route commits | `on_payment_verified` |
| A booking no longer `accepted` is not moved to `paid` (payment is noted) | `on_payment_verified` |
| Re-verifying a `verified` payment whose queue is still `queued` re-runs the listener without calling Paystack | msflib-payments router |
| Test keys only; no payouts, refunds or webhooks | ADR 0019 |
| `AppPaymentNotice` shown wherever payment appears | `BookingView`, `PaymentReturn` |

### 7.3 Payment data

```mermaid
erDiagram
  ACCOUNT ||--o{ PAYMENT : "pays"
  BOOKING ||--o| PAYMENT : "payment_id"
  PAYMENT ||--o{ PAYMENTQUEUE : "payment_id"

  BOOKING {
    int id
    string status
    int price_amount "minor units"
    string currency
    int payment_id
  }
  PAYMENT {
    int id
    int account_id
    float amount "major units"
    string reference
    string authorization_url
    string status "unverified, verified, failed, fulfilled"
    string gateway "paystack"
    json data "booking_id, currency"
  }
  PAYMENTQUEUE {
    int id
    int payment_id
    string event_key "booking-payment"
    json data "booking_id"
    string status "queued, processed"
  }
```

`PAYMENT` and `PAYMENTQUEUE` are msflib-payments tables; `BOOKING` is Helpr's.

Settings (flat names in `backend/.env`): `PAYMENT_GATEWAY=paystack`,
`PAYMENT_CALLBACK_URL=http://localhost:3000/bookings/payment`, `PAYSTACK_BASE_URL`,
`PAYSTACK_SECRET_KEY` (test key).

Files: `backend/app/services/booking.py`, `backend/app/eventbus/__init__.py`,
`frontend/api/booking.api.ts`, `frontend/api/payment.api.ts`, `frontend/hooks/booking.hooks.ts`,
`frontend/app/(protected)/bookings/view/components/BookingView.tsx`,
`frontend/app/(protected)/bookings/payment/components/PaymentReturn.tsx`.

## 8. In-app notifications (msflib-notifications)

```mermaid
sequenceDiagram
  autonumber
  participant SVC as Helpr booking service
  participant NAC as notify_after_commit (Helpr)
  participant SQL as SQLAlchemy session events
  participant NA as notify_accounts (Helpr)
  participant D as dispatch_account_notifications (MSFLib)
  participant DB as notification + accountnotification
  participant FE as notification.api.ts + hooks
  participant R as account_notification_router (MSFLib)

  SVC->>NAC: receivers, title, message
  NAC->>SQL: listen after_commit and after_soft_rollback
  SVC->>SQL: business commit
  alt committed
    SQL->>NA: send in a fresh session
    NA->>D: NotificationCreate(channels inapp), n_type system, receivers
    D->>DB: save and commit
  else rolled back
    SQL->>NAC: cancel, nothing sent
  end

  loop every BOOKING_REFRESH_MS
    FE->>R: GET /notifications/?offset&limit (isWorkspaceScoped false)
    R-->>FE: caller's AccountNotificationRead list
  end
  FE->>R: PATCH /notifications/{id}/mark?status= or /notifications/mark-all?status=
```

| Event | Who is notified |
|---|---|
| Booking requested, cancelled by customer, paid, reviewed | Provider workspace owner and admins (`provider_managers`) |
| Booking accepted, declined, cancelled by provider, completed | The booking's customer |

Dispatch commits, so it never runs inside a lifecycle pre-commit hook or directly in the
payment listener (ADR 0021).

Files: `backend/app/services/notification.py`, `backend/app/services/booking.py`,
`frontend/api/notification.api.ts`, `frontend/hooks/notification.hooks.ts`.

## 9. Provider photos (msflib core uploads, ADR 0027)

Backend only so far; the frontend does not call these routes yet.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client (multipart)
  participant EP as POST /{slug}/provider/photo or /photos (Helpr)
  participant S as provider_photo service (Helpr)
  participant U as msflib.utils.uploads
  participant FS as ./uploads (LocalStorage)
  participant ST as StaticFiles at STORAGE_BASE_URL

  C->>EP: UploadFile (owner or admin via get_provider_context)
  EP->>S: save photo
  S->>U: validate_upload(file, max_bytes, allowed_content_types)
  U-->>S: 413 too big, 415 wrong type, or ok
  S->>U: save_file_blob(file, parent_folder, storage_bucket, filename, settings)
  U->>FS: write file
  U-->>S: StorageBlob(url, filename, content_type, size_bytes)
  S-->>EP: ProviderPhotoPublic (409 beyond 8 photos)
  C->>ST: GET /uploads/... served from the API origin
```

When the frontend adds this, it should send the file with
`configuredApiClient({ isWorkspaceScoped: true }).apiFormDataClient(...)` from a `FormBuilder`
field with `eType: 'upload'` (both recorded in `msflib-facts.md`).

Files: `backend/app/services/provider_photo.py`,
`backend/app/api/api_v1/endpoints/provider_area.py`.
