# 0024. Monochrome glass look for the landing page

- Status: Accepted; scope widened to the whole app by ADR 0026
- Date: 2026-10-09
- Amends: ADR 0020 and 0023, for `/` only (every other screen keeps Quorvix teal and Geist)
- Depends on: ADR 0016, 0018 (Web Interface Guidelines)

## Context
The project owner supplied a landing-page brief: light, almost monochrome, a slow animated
silver swirl seen through fluted glass behind the page, frosted-glass cards and pills, an
editorial serif for headlines, full-screen sections with scroll reveals and a marquee. The brief
came from another product; the owner chose to keep Helpr's content and apply only the look, and
only on the landing page.

## Decision
- **Scope.** Only `app/(public)/page.tsx` and `app/(public)/components/landing/*` use this look,
  under the `.helpr-landing` wrapper. Services, auth and app screens are unchanged.
- **Tokens** (in `theme/theme.css`): `--canvas` `#f7f8fa`, `--ink` `#111318`, `--glass` white,
  `--swirl-1…4` (`#fff`, `#e6e8ef`, `#c3c7d4`, `#b4b8c6`), `shadow-glass`
  (`0 10px 28px rgb(17 19 24 / 0.06)`). Muted text uses ink opacity (`text-ink/70`, `/65`, `/60`),
  not extra greys. The brief's 45% for meta text is raised to 60%: 45% ink on the pale
  background is below 4.5:1 at 12 px. Landing type classes: `l-h1`, `l-h2`, `l-h3`, `l-num`, `l-marquee`.
- **Type.** Headlines in Instrument Serif via `next/font/google`, loaded only on `/`
  (`--font-instrument-serif` on the wrapper). Body and UI stay Geist.
- **Background.** One fixed `<canvas>` drawn with the raw WebGL API (no library): fbm swirl,
  diagonal flutes, film grain. Rendered at half resolution, capped at 30 fps, paused when the tab is
  hidden, a single still frame under `prefers-reduced-motion`. Colours come from the swirl tokens.
  If WebGL is unavailable the canvas stays transparent and `--canvas` shows.
- **Icons** are `@mui/icons-material` outlined icons in ink tiles; Lucide is not added (ADR 0016).
- **Motion**: background, scroll reveals (`Reveal`, IntersectionObserver), marquee (CSS, pauses on
  hover), arrow hovers. All honour reduced motion.
- Parts of the brief with no Helpr meaning are dropped: wallet/chain switch, X (Twitter) links.
  The "connected" state of the hero's second button becomes "signed in" (`useAuth`).

## Alternatives considered
- Apply the look to the whole app: the owner chose landing only.
- `three.js` / `ogl` for the background, `framer-motion` for reveals, `lucide-react` for icons:
  packages outside the template (ADR 0016). Raw WebGL, CSS and MUI icons cover the brief.

## Consequences
- Two visual languages: glass/serif on `/`, Quorvix teal everywhere else. Moving from the landing
  page to `/services` changes look; this is accepted by the owner.
- White on `--ink` is about 18:1; ink at 65–70% on the pale background stays above 4.5:1.
- The shader runs continuously while `/` is open; it is cheap at half resolution but uses GPU.
