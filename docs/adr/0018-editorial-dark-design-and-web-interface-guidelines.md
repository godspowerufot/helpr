# 0018. Editorial dark design language and Vercel Web Interface Guidelines

- Status: Accepted; the **Look** is superseded by ADR 0020 (guidelines, mechanism, copy rules
  still apply)
- Date: 2026-10-09
- Supersedes: ADR 0017
- Depends on: ADR 0016

## Context
The team chose a design reference and a design guide for the frontend:
- **Reference:** Icebug's homepage (icebug.com), tagged Minimal, Clean, Big Background Image,
  Large Type, Editorial, Dark. It pairs full-bleed imagery with a bold editorial hero and
  simple navigation.
- **Guide:** Vercel's Web Interface Guidelines, installed as the `web-design-guidelines`
  skill in `.agents/skills/` (rules fetched from
  `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`).

ADR 0017 was light, image-free and list-based. That contradicts the reference.

## Decision
- **Look:** dark, editorial, minimal. Near-black canvas, off-white type, one inverted
  (off-white) filled action. Large display type and full-bleed photography carry the public
  pages; the signed-in app (bookings, provider area) uses the same palette but stays quiet:
  no imagery, smaller type, dense lists and tables.
- **Imagery is static and owned by the frontend:** one hero image and one image per category
  in `public/images/`, keyed by category slug. No listing photos (still "Later" in
  `MVP.md`). No backend change.
- **Mechanism unchanged:** values go into the template's tokens (`theme/theme.css`,
  `theme/theme.config.ts`); new tokens (`--warning`, `--display-*`, `--scrim`) are added the
  template's way. Components stay token-only.
- **Web Interface Guidelines are binding** for every UI file, and every frontend change is
  reviewed with the `web-design-guidelines` skill before it is called done.
- **Precedence:** the MSFLib template guide decides structure and packages; the Web Interface
  Guidelines decide interface quality (accessibility, focus, forms, motion, typography,
  copy). Where a guideline needs a package outside the stack (`nuqs`, `virtua`), use the
  stack's equivalent (`useSearchParams`, `TableWidget` pagination or
  `content-visibility: auto`).
- **Copy case:** headings and buttons use Title Case (guidelines), overriding the template
  guide's sentence-case line. Body text, helper text and toasts stay sentence case.

## Alternatives considered
- Keep ADR 0017 (light, no imagery): rejected; does not match the chosen reference.
- Dark only on the landing page, light app: rejected; two themes double the token and
  contrast work for a 24-hour build.
- Listing photos from providers: rejected for the MVP; needs uploads, storage and moderation.

## Consequences
- Contrast must be re-checked on dark: status colours use lighter tints, and text over
  photos needs a scrim.
- `<html>` gets `color-scheme: dark` and a matching `<meta name="theme-color">`.
- Images need licences, explicit `width`/`height`, `priority` above the fold and
  `loading="lazy"` below; static export means `next/image` with `unoptimized`.
- One more review step per change (the skill), producing `file:line` findings that must be
  fixed or explicitly waived.
