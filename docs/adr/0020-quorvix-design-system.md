# 0020. Quorvix design system for the UI layer

- Status: Accepted (typeface amended by ADR 0023: Geist replaces Gilroy/Inter Tight; colours,
  radii and heading type superseded by ADR 0026)
- Date: 2026-10-09
- Supersedes: ADR 0018 (look only; its guidelines, mechanism and copy rules stay)
- Depends on: ADR 0016

## Context
The project owner supplied a design system in `frontend/docs copy/design-system/` (named
"Quorvix Admin": `README.md`, `components.md`, `theme.css`, `variables.css`, `tokens.ts`,
`tailwind.config.js`) and asked that it drive the UI only. MSFLib stays the frontend
foundation: `@msflib/*` packages, `useAuth`, `configuredApiClient`, `FormBuilder`,
`TableWidget`, `AppSkeleton` and the template structure are unchanged.

The system is light, with a teal brand colour, Gilroy type, a 4 px spacing scale, 4/8/12/16 px
radii, soft shadows, cards, and Iconify (Hugeicons) icons. ADR 0018's look is dark and
editorial, so the two cannot both apply.

## Decision
- **Look:** Quorvix replaces ADR 0018's palette, type scale, radii, shadows and card rule.
  Light canvas, `#1C1C1C` text with 80/40/20/10/5 % steps, teal `#008B8B` brand, brand light
  `#D8F0F1`, success `#34C759`, error `#F94E72`.
- **Mechanism unchanged:** values go into the template tokens (`theme/theme.css`,
  `theme/theme.config.ts`). Template token names keep their meaning (`--primary` is the
  brand, `--text-light` is secondary text). Quorvix colour and radius names are added as
  aliases in `@theme inline` (`bg-brand-primary`, `text-black-80`, `rounded-card`, …).
  Spacing uses Tailwind's numeric scale, which is the same 4 px system (`xs`–`xxl` =
  `1, 2, 4, 6, 8, 12`): named `--spacing-md` etc. would also redefine `max-w-md`, `w-sm`, …
  and broke the template's auth card. Components stay token-only.
- **Type:** Quorvix scale (48 / 32 / 24 / 18 / 14 / 12 px), weights 400 and 600, mapped onto
  the template classes (`h1`–`h6`, `b1`, `b2`, `f1`, `d1`, `d2`). Gilroy is first in the
  stack; Inter Tight (already loaded) is the fallback because Gilroy is a licensed font with
  no files in the repo. Adding `public/fonts/` Gilroy files later needs only an
  `@font-face` block.
- **Components:** buttons, inputs and cards follow `components.md` (8 px radius, semibold
  labels, teal fill, outlined teal, 4 px brand-light focus ring on inputs, 12 px cards with
  `shadow-sm`).
- **Not adopted, because they are outside the stack (ADR 0015/0016):**
  - Iconify / `@iconify/react`: use `@mui/icons-material`, already installed, outlined
    variants, same sizes (16/20/24 px).
  - `clsx` (from `UI_COMPONENTS.md`): use template literals.
  - The design system's own `Button` / `Input` components: use `AppButton` and `FormBuilder`.
  - `transition-*` utilities that set `transition: all`: the Web Interface Guidelines forbid
    it; list the properties.
- **Kept from ADR 0018:** Vercel Web Interface Guidelines are binding; Title Case for
  headings and buttons; one filled action per screen; static, licensed imagery only.

## Alternatives considered
- Keep ADR 0018 dark: rejected by the project owner.
- Install Iconify and `clsx` as the design system suggests: rejected; ADR 0016 limits the
  frontend to the template's packages and MUI already ships icons.
- Copy `variables.css` utility classes verbatim: rejected; they redefine Tailwind utilities
  (`.text-sm`, `.p-md`, `.bg-white`) outside the cascade layers and would fight Tailwind v4.

## Consequences
- `html` uses `color-scheme: light` and `theme-color: #FFFFFF`.
- Contrast to watch (WCAG AA 4.5:1 for body text): white on `#008B8B` is about 4.2:1, and
  `#34C759` / `#F94E72` as text on white are below 3.5:1. Outlined and link text use the
  darker hover teal `#007070` (about 5.9:1). Status and error text pair the colour with a
  label, not colour alone. Darkening the brand fill is an open owner decision.
- `docs/FRONTEND.md` §7–§8 describe the Quorvix tokens.
