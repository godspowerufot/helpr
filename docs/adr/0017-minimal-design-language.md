# 0017. Minimal design language expressed only through template tokens

- Status: Superseded by [ADR 0018](0018-editorial-dark-design-and-web-interface-guidelines.md)
- Date: 2026-10-09
- Depends on: ADR 0016

## Context
Helpr is judged in a short demo. The team is design-led and wants a minimal UI where the
content (services, prices, booking status) carries the screen. The MSFLib template already
defines how styling works: tokens in `theme/theme.css`, mirrored in `theme/theme.config.ts`,
typography classes (`h1-*` … `f2-*`), no hex values or Tailwind palette colours in components.

## Decision
- Minimalism is implemented **inside** the template's token system, not beside it: we change
  token values, never the mechanism. Component code stays token-only.
- Monochrome base with one accent. `--primary` is near-black ink; colour appears only for
  booking status and errors.
- One font family, two weights in practice (`-r` 400 body, `-m` 500 headings and labels);
  `-b` 700 only for prices and key numbers.
- Hierarchy comes from size, weight and whitespace, not from boxes, shadows or colour.
- Exact values and rules live in `docs/FRONTEND.md` §7–§8.

## Alternatives considered
- Keep the template's default palette (green/orange/red, 25 px radius, Lexend): rejected;
  three brand colours and pill shapes compete with content.
- A separate design system or component library: rejected by ADR 0016 (MSFLib stack only).

## Consequences
- Every screen has at most one filled (primary) button.
- Status colours must stay accessible on white (WCAG AA) and always pair with a text label.
- Changing the look later is a token edit in two files (`theme.css`, `theme.config.ts`).
