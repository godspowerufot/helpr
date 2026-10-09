# 0026. Monochrome glass across the whole app

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0020's colours, radii and heading type (the Quorvix size scale for body text
  stays); widens ADR 0024 from `/` to every screen
- Depends on: ADR 0016, 0018 (Web Interface Guidelines), 0023, 0024

## Context

ADR 0024 put the monochrome glass look on the landing page only. Moving to `/services`, the
auth screens or the dashboard switched to Quorvix teal, white cards and Geist headings. The project
owner asked for the landing design to be used everywhere in the application.

## Decision

- **Tokens, not per-screen styles.** The existing token names stay; their values change in
  `theme/theme.css` and the MUI palette in `theme/theme.config.ts`, so every screen (including
  MSFLib `FormBuilder` and `TableWidget` output) picks up the look:
  - `--primary` and `--text` are `--ink` (`#111318`); `--primary-dark` `#2b2e36` (hover);
    `--primary-light` `#e6e8ef`; `--text-light` ink at 70%; `--stroke` / `--stroke-light` ink
    at 15% / 8%.
  - `--background` is `--canvas`; `--surface` is white at 60%; `--background-light` is ink at 4%
    (translucent, so the background shows through tinted areas).
  - `--card-banner` is an ink-to-silver gradient. `--app-radius` 16px, `--input-radius` 12px,
    `--button-radius` fully round. Shadows are the soft ink `shadow-glass` family.
  - Selection and focus rings are ink.
- **Type.** Instrument Serif and Geist both load in `app/layout.tsx`. `h1`–`h4` and `d1`/`d2`
  classes use the serif at weight 400 (it has one weight; no faux bold). `h5` and smaller, body
  and UI stay Geist.
- **Background.** The WebGL swirl from ADR 0024 moves to `components/AppBackground.tsx`, rendered
  once in the root layout behind every route.
- **Shared chrome.** `components/SiteNav.tsx` (floating glass pill nav, circle-reveal mobile
  menu), `SiteShell.tsx` and `SiteFooter.tsx` are used by the landing page, `/services`,
  `/services/view` and the auth screens. On `/` the nav tracks sections; elsewhere it marks the
  current route.
- **Glass primitives** live in `styles/glass.styles.ts` (`CONTAINER`, `GLASS_CARD`, `ICON_TILE`,
  `PILL_DARK`, `PILL_GLASS`). `AppButton` contained is the ink pill; outlined is the frosted pill.
- Scroll snap and full-screen sections stay landing-only; app screens scroll normally.

## Alternatives considered

- Keep two looks (ADR 0024 as written): rejected by the owner.
- Add new token names and migrate every class: more churn; reusing names restyles MSFLib-rendered
  forms and tables without touching them.

## Consequences

- One visual language from `/` to the dashboard.
- Text contrast: ink on the pale canvas is about 17:1; ink at 70% stays above 4.5:1.
- The shader now runs on every route while the tab is visible (half resolution, 30 fps cap,
  paused when hidden, still under reduced motion).
- `backdrop-filter` blur is used on cards and the nav; where unsupported, the translucent white
  still reads as a card.
