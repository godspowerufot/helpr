# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-10-09

## Context
Helpr is built quickly, by one developer working with AI coding agents, on a library
(MSFLib) whose documentation is partly verified, partly unverified, and partly generated.
Without a written record, agents re-decide settled questions and invent MSFLib APIs.

## Decision
- Every decision that affects data shape, security, module boundaries or the MSFLib
  integration gets an ADR in `docs/adr/`.
- ADRs cite rows in `docs/msflib-facts.md` for every MSFLib claim.
- A decision that depends on an unverified assumption is `Needs validation` and lists the
  exact validation test.
- Changing an accepted decision means a new ADR that supersedes the old one; the old one is
  kept and marked `Superseded`.

## Alternatives considered
- A single design doc: rejected, because it hides which decisions are settled and which are
  open.
- No documentation: rejected, because agents repeatedly guess.

## Consequences
Small overhead per decision. In exchange, reviews and agent sessions start from a shared,
explicit baseline.
