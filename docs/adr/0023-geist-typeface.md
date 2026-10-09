# 0023. Geist typeface

- Status: Accepted
- Date: 2026-10-09
- Amends: ADR 0020 (typography only; colours, spacing, radii and shadows are unchanged)

## Context
ADR 0020 set Gilroy as the typeface with Inter Tight as the loaded fallback. Gilroy is a
licensed font with no files in the repo, so every screen actually rendered in Inter Tight,
fetched at runtime from `fonts.googleapis.com` through a CSS `@import`. The project owner asked
for Geist across the UI.

## Decision
- The app typeface is **Geist**, loaded with `next/font/google` in `app/layout.tsx`
  (`variable: '--font-geist'` on `<html>`). `next/font` ships with Next.js, so no package is added.
- `--font-app-font` in `theme/theme.css` is `var(--font-geist)` followed by the system stack.
  Every template typography class and the MUI theme already read `--font-app-font`, so nothing
  else changes.
- The Inter Tight `@import` is removed. The type scale and weights (400 and 600) from ADR 0020
  stay as they are.

## Alternatives considered
- Keep Gilroy/Inter Tight: not what the owner asked for.
- The `geist` npm package: adds a dependency outside the template (ADR 0016); `next/font/google`
  serves the same font.

## Consequences
- The font is self-hosted at build time: no runtime request to Google, no layout shift.
- `pnpm build` downloads the font files once, so the build machine needs network access to
  Google Fonts (or a warm cache).
