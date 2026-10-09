# Helpr — Frontend Architecture and Design Guide

Applies to `frontend/`. Decisions: ADR 0016 (MSFLib React template), ADR 0020 (Quorvix
design system, UI only), ADR 0018 (Web Interface Guidelines; its dark look is superseded),
ADR 0005 (provider workspaces), ADR 0011 (money), ADR 0013 (token storage).

**Order of authority** for any frontend decision:
1. `frontend/docs/IMPLEMENTATION_GUIDE.md` — the MSFLib template's guide. Binding.
2. This file — Helpr specifics the guide leaves open (routes, workspace scoping, domain
   display, design tokens).
3. Vercel Web Interface Guidelines (`web-design-guidelines` skill) — interface quality
   (accessibility, focus, forms, motion, typography, copy). Applied as mapped in §7.3.
4. `frontend/node_modules/@msflib/<pkg>/dist/index.d.ts` — the truth for any MSFLib API.
   The docs site can be wrong (see ADR 0016, logout method).

If this file and the template guide disagree, the guide wins; raise it and fix this file.

## 1. Stack (MSFLib React template only)

| Concern | Package | Notes |
|---|---|---|
| Framework | Next.js App Router, `output: 'export'` | Static SPA; read `node_modules/next/dist/docs/` before using framework APIs |
| Config, HTTP, storage, active workspace | `@msflib/core` | `configureApplication`, `configuredApiClient`, `storage`, `setActiveWorkspace` |
| Auth | `@msflib/react-auth` | `AuthProvider`, `useAuth` (`login`, `register`, `me`, `logout`, `status`) |
| Forms, tables, skeletons | `@msflib/react-components` | `FormBuilder`, `TableWidget`, `AppSkeleton` via `dynamics/` |
| Workspace hooks | `@msflib/react-shared`, `@msflib/react-workspace` | `useActiveWorkspace`, `workspaceHookDecorator('path')` |
| HTTP primitives | `@msflib/typescript` | Used through `@msflib/core`; not called directly |
| UI primitives | MUI | Only where no MSFLib component fits |
| Layout | Tailwind 4 | Token classes only |
| Server state | TanStack Query 5 | |
| Toasts | `react-toastify` | |
| E2E | Playwright | |
| Package manager | pnpm | Never npm or yarn |

Nothing else. No new dependency, MSFLib module or UI kit without an ADR (ADR 0015, 0016).

## 2. Bootstrapping

`lib/application.config.ts` (template file), Helpr values:

```ts
configureApplication({
  baseURL: process.env.NEXT_PUBLIC_API_URL,          // http://localhost:8000/api/v1
  accessTokenKey: process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY, // helpr_access_token
  apiClientDecorator: workspaceHookDecorator('path'),
  endpoints: { auth: { register: '/open' } },
});
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WORKSPACE_MODE=multi
NEXT_PUBLIC_WORKSPACE_STRATEGY=path
NEXT_PUBLIC_ACCESS_TOKEN_KEY=helpr_access_token
```

`app/Provider.tsx`: `QueryClientProvider` → `ThemeProvider` → `AuthProvider options={{ isWorkspaceScoped: false }}`
→ `ToastContainer`. Auth is never workspace-scoped: `/login`, `/open`, `/me`, `/logout` are global.

## 3. Workspace scoping (the one rule that breaks things if missed)

`@msflib/core` registers every `configuredApiClient()` path as **workspace-scoped unless told
otherwise**. When a provider workspace is active, every scoped path gets `/{slug}` prefixed.

| API file kind | Client | Example request |
|---|---|---|
| Public (`listing.api.ts`, `category.api.ts`, `provider-public.api.ts`) | `configuredApiClient({ isWorkspaceScoped: false })` | `GET /listings` |
| Customer (`booking.api.ts`, `provider-onboarding.api.ts`) | `configuredApiClient({ isWorkspaceScoped: false })` | `GET /bookings/mine` |
| Provider (`provider-*.api.ts` under the provider area) | `configuredApiClient({ isWorkspaceScoped: true })` | `GET /provider/listings` → `/api/v1/{slug}/provider/listings` |
| Provider uploads (`provider-workspace.api.ts` photos) | `configuredApiClient({ isWorkspaceScoped: true }).apiFormDataClient` + `asFormData` from `@msflib/typescript` | `POST /provider/photos` (multipart) |

Rules:
- Every API file passes `isWorkspaceScoped` explicitly. Never rely on the default.
- The provider area layout resolves the slug from `GET /providers/mine`, calls
  `setActiveWorkspace(slug)` on mount and `setActiveWorkspace(null)` on unmount. The last used
  slug is kept with `storage` from `@msflib/core` (key `helpr_active_workspace`).
- Provider query keys start with the workspace: `[workspace, 'provider', 'listings']`
  (`useActiveWorkspace()`), so switching business never shows another business's cache.

## 4. Routes

Static export: no `[id]` folders. Detail = `view?id=`, create/update = `manage?id=`.
All paths live in `constant/routes.constant.ts`.

| Route | Group | Story |
|---|---|---|
| `/` | public | C1 — search + categories |
| `/services` | public | C1 — filter bar, cards left and a sticky Google map right that follows the hovered or focused card (ADR 0030); below `lg` a List / Map switch, `?view=map` selects the map |
| `/services/view?id=` | public | C2, C4 entry |
| `/providers/view?slug=` | public | C2 |
| `/login`, `/register` | auth | C3 (`useAuth().login` / `register`). `/register` has a Client / Provider tab (`?as=provider`); it only picks the destination after sign-up (`/services` or `/provider/onboard`), never an account type (ADR 0004) |
| `/bookings` | protected | C5 |
| `/bookings/manage?listing_id=` | protected | C4 — request a booking; the "when" step lists the provider's blocked days (native date inputs cannot grey them out) and a 409 returns to that step |
| `/bookings/view?id=` | protected | C5–C8 — timeline, pay, cancel, review |
| `/provider/onboard` | protected | P1 |
| `/provider` | protected, provider | P3, P6 — dashboard, needs-action counts, earnings |
| `/provider/listings` | protected, provider | P2 — `TableWidget` |
| `/provider/listings/manage?id=` | protected, provider | P2 — `FormBuilder` |
| `/provider/bookings` | protected, provider | P4 — `TableWidget` |
| `/provider/bookings/view?id=` | protected, provider | P4, P5 — accept, decline, complete |
| `/provider/availability` | protected, provider | P9 — block a day (`FormBuilder`), blocked days list with Unblock |
| `/provider/profile` | protected, provider | P1, P8 — Details, Business Photo and Work Photos cards (`FormBuilder` `upload` fields) |

Folder layout, file naming (`<entity>.<kind>.ts`), colocation and `page.tsx` thinness follow
the template guide §3–§5.

## 5. Data flow

```
types/booking.types.ts → api/booking.api.ts → hooks/booking.hooks.ts → feature component
```

- Components never call `fetch` or an API file; they use hooks. Auth uses `useAuth()` only;
  never write a local auth context or token handling.
- All data keys are `snake_case`, matching the backend. Money is integer minor units (ADR 0011).
- One key factory per entity in its hooks file. Mutations invalidate in the hook; toasts and
  navigation happen in the component.

| Mutation | Invalidate |
|---|---|
| Request, cancel, pay, review (customer) | `bookingKeys.all`; review also `listingKeys.detail(listing_id)` |
| Accept, decline, cancel, complete (provider) | `providerBookingKeys.all`, `providerKeys.dashboard` |
| Listing create, update, publish, archive | `providerListingKeys.all`, `listingKeys.all` |
| Photo set/remove/add, block/unblock day | `providerKeys.all` (my blocked days live under `providerKeys.dashboard`, so switching business clears them) |

Booking updates (ADR 0021): booking lists, booking view and the provider dashboard use
`refetchInterval: 20_000` and refetch on window focus. The notification inbox reads
`/notifications/` (`isWorkspaceScoped: false`, same 20 s refresh) through
`hooks/notification.hooks.ts`; the unread count comes from the same query.
Each activity message ends with `[[helpr:<path>]]` (ADR 0031). The bell strips that marker
and the row links there: `/bookings/view?id=` for the customer, or
`/provider/bookings/view?id=&workspace=` for the provider. The `workspace` value selects
that business before its bookings load. Opening the row marks it read.

Errors: `react-toastify` for failed actions; inline field errors through `FormBuilder`
validation; 409 on a booking action shows "This booking changed. Showing the latest." and
refetches. 401 → `useAuth().status` becomes `unauthenticated` → protected layout redirects
to `/login`. Provider 403/404 → "You don't have access to this business."

## 6. Domain display rules

| Item | Rule |
|---|---|
| Money | `utils/money.utils.ts` → `formatMoney(amount, currency)`: `Intl.NumberFormat('en-NG', { style: 'currency', currency })` on `amount / 100` |
| Dates | Local time, short: "Sat 12 Oct, 10:00" |
| Booking status | `AppStatus` — dot + label; colour is never the only signal |
| Ratings | "4.8 (23)"; no reviews → "New" |
| Payment | `AppPaymentNotice` beside every pay action and receipt: "Test payments via Paystack. Use a Paystack test card; no real money moves." (ADR 0019) |

| Status | Label | Token |
|---|---|---|
| `requested` | Waiting for provider | `text-light` |
| `accepted` | Accepted · payment due | `warning` |
| `paid` | Paid · scheduled | `text` |
| `completed` | Completed | `success` |
| `declined` | Declined | `disabled` |
| `cancelled` | Cancelled | `disabled` |

## 7. Design language (ADR 0026, quality bar from ADR 0018)

Two binding sources:
- **Look:** monochrome glass on every screen (ADR 0026, from the landing brief in ADR 0024):
  pale canvas with the WebGL swirl behind it (`components/AppBackground.tsx`), frosted glass cards
  and pills, ink (`#111318`) for the one filled action, Instrument Serif headings, Geist for
  body and UI. Primitives live in `styles/glass.styles.ts`; shared chrome is `SiteNav`,
  `SiteShell`, `SiteFooter`. The Quorvix body type scale (ADR 0020) still applies. UI only: it
  never replaces an MSFLib package, hook or component.
- **Quality bar:** Vercel's Web Interface Guidelines, via the `web-design-guidelines` skill
  (`.agents/skills/web-design-guidelines/`). Every rule there applies to every UI file.

### 7.1 Layout

| | Public pages (`/`, `/services`, `/services/view`, `/providers/view`) | App (`/login`, `/register`, `/bookings*`, `/provider*`) |
|---|---|---|
| Canvas | Swirl background; content in `GLASS_CARD`s; floating `SiteNav` | Swirl background; glass sidebar, header and cards |
| Type | `l-h1`/`d1` serif hero, `h1`/`h2` serif page titles, `h5` Geist card titles | `h4` serif page title; `b2` body |
| Width | Text column max 1280 px | Max 1040 px |
| Layout | Stacked sections; cards in 2–4 column grids | Sidebar shell from the template (`/provider`), single column elsewhere |

### 7.2 Principles

1. **4 px system.** Spacing `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32, `xxl` 48, written with
   Tailwind's numeric scale: `1`, `2`, `4`, `6`, `8`, `12` (`p-4` = Quorvix `p-md`). Never add
   named `--spacing-*` keys; they also redefine `max-w-md` and friends. Radii: buttons and pills
   fully round, inputs 12, `rounded-card` 12 (inner tiles), `rounded-modal` 16 (glass cards).
2. **One filled action per screen.** Ink pill (`AppButton` contained / `PILL_DARK`), white label,
   hover `--primary-dark`. Secondary actions are frosted glass pills (`AppButton` outlined /
   `PILL_GLASS`) or text.
3. **Navigation.** `SiteNav`: floating glass pill, logo left, links centre (≥ lg), auth pills
   right; full-screen circle-reveal menu below lg.
4. **Cards group content.** `GLASS_CARD` (white 42 %, white 70 % border, 18 px blur,
   `shadow-glass`, 16 px radius); hover raises the white when the whole card is a link. Dividers
   inside a card use ink at 10 %.
5. **Lists:** search results are cards with an `h5-m` title, provider and area as meta, price
   right-aligned in tabular numbers.
6. **Icons:** `@mui/icons-material` outlined (Iconify is outside the stack), 16/20/24 px, in a
   48 px ink tile (`ICON_TILE`) on cards, always beside a text label, `aria-hidden="true"`.
7. **Motion.** 150 / 200 / 300 ms; list the properties (`transition-shadow`,
   `transition-colors`), never `transition: all`. Nothing animates on load. Under
   `prefers-reduced-motion`, nothing moves.
8. **Copy.** Title Case for headings and buttons ("Request Booking", "Accept Booking"); sentence
   case for body, helper text and toasts. Active voice, second person, numerals ("3 bookings").
   Errors say how to fix it. Use `…` and curly quotes; loading text ends with `…`
   ("Saving…").

### 7.3 Web Interface Guidelines: how they map to our stack

| Guideline | Helpr implementation |
|---|---|
| Visible focus, `:focus-visible`, never bare `outline-none` | 2 px ink ring with 2 px offset, in `theme.css` and MUI `focusVisible` overrides |
| Inputs: label, `name`, `autocomplete`, correct `type`/`inputmode`, no paste blocking | Labels are MUI `TextField` labels linked to the input (never MSFLib `isCustomLabel`, which renders an unlinked `<h1>`), kept raised by the theme so placeholders and native date text stay visible; selects need `mData.select: true`. `FormBuilder` elements: `eType` `email`/`password`/`number`, `mData.inputProps` for `autoComplete`, `inputMode`, `spellCheck={false}` on email |
| Errors inline; focus first error | `FormBuilder` `validation` messages; toasts only for request failures |
| Submit enabled until the request starts | `loadingState` only while the mutation is pending |
| URL reflects state (filters, tabs, pagination) | `useSearchParams` + `router.replace` (no `nuqs`; ADR 0016) |
| Large lists virtualised | `TableWidget` pagination; public list pages paginate at 20 |
| Links for navigation | `AppButton href` / Next `Link`; never `onClick` + `router.push` for plain navigation |
| Destructive actions confirm | `AppConfirmDialog` for decline, cancel, archive |
| Images: dimensions, `priority` above fold, `loading="lazy"` below, `alt` | `next/image` (unoptimized, static export) with width/height from `data/image.data.ts` |
| `color-scheme`; `theme-color` matches background | `<html style="color-scheme: light">`; `viewport.themeColor` = `#f7f8fa` (canvas) |
| Safe areas on full-bleed | Hero and header padding use `env(safe-area-inset-*)` |
| `Intl.*` for dates and money | `utils/date.utils.ts`, `utils/money.utils.ts` |
| `aria-live="polite"` for async updates | Booking status, toasts (`ToastContainer role="status"`) |
| Tabular numbers | `tabular-nums` on prices, earnings, counts |
| Headings balanced | `text-balance` on `d1`/`d2`/`h*` |
| `touch-action: manipulation`; `overscroll-behavior: contain` in dialogs | Global in `theme.css`; MUI `Dialog`/`Drawer` `sx` |

### 7.4 Imagery

- Static files in `public/images/`: `hero.jpg` and one `category/<slug>.jpg` per seeded
  category (cleaning, plumbing, electrical, beauty, moving, repairs).
- Sources must be licensed for reuse (e.g. Unsplash licence); record source and photographer in
  `data/image.data.ts` next to width, height and `alt`.
- Photographs only: real people and places, natural light, dark or neutral tones. No stock
  handshakes, no illustrations.
- Text on a photo always sits on `--scrim` and meets 4.5:1.
- Size: hero ≤ 400 KB (2400 px wide, JPEG/AVIF), tiles ≤ 150 KB.
- Provider-uploaded photos (ADR 0027) come back as `/uploads/...` paths on the API origin;
  render them through `mediaUrl()` (`utils/media.utils.ts`). Upload buttons are outlined
  (`outlinedButtonStyle()`) so they never compete with the screen's one filled action.

## 8. Tokens (`theme/theme.css` + `theme/theme.config.ts`, same values in both)

Template token names keep their meaning; values are monochrome glass (ADR 0026).

| Token | Value | Source | Use |
|---|---|---|---|
| `--canvas` / `--ink` / `--glass` | `#f7f8fa` / `#111318` / `#ffffff` | ADR 0024 | Page, text and fills, glass white (`bg-glass/42`, `text-ink/70`) |
| `--swirl-1` … `--swirl-4` | `#fff`, `#e6e8ef`, `#c3c7d4`, `#b4b8c6` | ADR 0024 | WebGL background colours |
| `--background` / `--surface` | canvas / white 60 % | | Page / inputs and plain surfaces |
| `--background-light` | ink 4 % | | Tinted areas, chips, hovers (translucent) |
| `--stroke` / `--stroke-light` | ink 15 % / 8 % | | Inputs, rules / dividers |
| `--text` / `--text-light` | ink / ink 70 % | | Primary / secondary text |
| `--disabled` | `#63656d` | | Placeholders, ended statuses |
| `--primary` / `--on-primary` | ink / `#ffffff` | | The filled action; focus ring |
| `--primary-light` | `#e6e8ef` | | Input focus ring, quiet tiles |
| `--primary-dark` | `#2b2e36` | | Hover fill |
| `--success` / `--success-light` | `#1f8a3f` / `#e1f8f0` | | Completed |
| `--warning` / `--warning-light` | `#a4997d` / `#fff7e5` | | Payment due |
| `--error` | `#d4294f` | | Errors, destructive confirm |
| `--info-light` | `#e8ebf2` | | Info notices |
| `--font-app-font` | `var(--font-geist), …` | ADR 0023 | Body and UI |
| `--font-serif` (`font-display`) | `var(--font-instrument-serif), Georgia, serif` | ADR 0026 | `h1`–`h4`, `d1`/`d2`, `l-*` |
| `--card-banner` | ink-to-silver gradient | | Banner strip on service cards |
| `--display-1` / `--display-2` | serif 400, 40→80 px / 36→52 px | | `.d1` hero, `.d2` section |
| `h1`–`h4` | serif 400: 40→56, 36→44, 32, 32 px | | Page and section titles |
| `h5`, `h6`, `b1`, `b2`, `f1` | Geist 18, 14 / 18, 14 / 12 px; `-b`/`-m` = 600, `-r` = 400 | Quorvix scale | Card titles, body, meta |
| `--app-radius` / `--button-radius` / `--input-radius` | `16px` / round / `12px` | | |
| `--shadow-sm` … `--shadow-xl`, `shadow-glass` | soft ink shadows | | Cards use `shadow-glass` |

Quorvix colour and radius aliases are defined in `@theme inline` (`bg-brand-primary`,
`bg-brand-light`, `text-black-80`, `bg-black-5`, `bg-secondary-mint`, `rounded-card`, …), so
`components.md` examples work after three substitutions: spacing names become numbers
(`px-md py-sm` → `px-4 py-2`), `transition-base` becomes `transition-shadow` /
`transition-colors`, and Iconify becomes MUI icons. MUI `theme.config.ts` uses
`palette.mode: 'light'` with the same values. `FormBuilder` styles (`styles/form.styles.ts`) and
`TableWidget` `styles` reference these variables only.

## 9. Helpr components (`components/App*.tsx`, built on MUI, props only, no fetching)

| Component | Purpose |
|---|---|
| `AppStatus` | Booking status dot + label (§6) |
| `AppPrice` | `formatMoney` output, tabular numbers |
| `AppRating` | "4.8 (23)" / "New" |
| `AppPaymentNotice` | Payment disclosure |
| `AppEmptyState` | Message + one action |
| `AppBookingTimeline` | Booking events in order, actor and time |

Template components are reused as-is: `AppButton`, `AppConfirmDialog` (decline, cancel,
complete), `AppContainer`, `AppLogo`. Loading uses `AppSkeleton` from
`@msflib/react-components`.

## 10. States, responsiveness, accessibility

- Every data screen: loading (`AppSkeleton` shaped like the content), empty (`AppEmptyState`),
  error (message + retry), success. Pending mutations disable the trigger (`loadingState`).
- Mobile first; works from 360 px. Tap targets ≥ 44 px.
- WCAG 2.1 AA contrast on dark, including text over photos (via `--scrim`); visible 2 px
  `--primary` focus ring; full keyboard use; skip link to main content.
- Status changes announced with `aria-live="polite"`.
- Everything else in the Web Interface Guidelines (§7.3) applies.

## 11. Current state (2026-10-09)

`frontend/` is still the ADR 0003 standalone app and must be regenerated from the template
(ADR 0016) before feature work. Steps:
1. Put `@msflib:registry=https://npm.pkg.github.com/` and the `read:packages` token in
   `~/.npmrc` (never in a committed file).
2. Scaffold with `npx @msflib/react-template@latest frontend` (multi-tenant: yes, strategy:
   path, optional modules: none), replacing the current folder.
3. Apply §2 config, §8 tokens (dark) and §7.4 images. Remove the template's public sample
   sections (`Hero`, `Features`, `GettingStarted`) and the `admin/lesson` feature; reuse the
   template's dashboard shell (`(protected)/components/DashboardLayout`, `Sidebar`, `Header`)
   for `/provider`, and its `(auth)/login` and `(auth)/register` screens for C3.
4. `pnpm lint`, `pnpm build`, then Checkpoint 0.3 (login through `useAuth`).

## 12. Done checklist (in addition to the template guide §18)

- `isWorkspaceScoped` passed explicitly in every API file.
- No colour, font or radius outside tokens; one filled button per screen.
- `AppPaymentNotice` wherever payment appears.
- **Design review:** run the `web-design-guidelines` skill on every changed UI file; fix each
  `file:line` finding or note why it is waived.
- `pnpm lint` and `pnpm build` pass; screen checked at 360 px and desktop.
