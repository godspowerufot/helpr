# 0002. Backend built on the MSFLib FastAPI template

- Status: Accepted
- Date: 2026-10-09
- Depends on: facts register "Template structure", "Blocker"

## Context
The hackathon requires meaningful use of MSFLib. The organisers provided
`github.com/msflib/fastapi-template`, which wires MSFLib core, auth, account, workspaces and
tenancy into a FastAPI app with Celery, Alembic, seeding and tests.

## Decision
- `backend/` is a clone of `msflib/fastapi-template`. We extend it; we do not restructure it.
- Our code goes in the template's extension points: `app/models/`, `app/actions/`,
  `app/services/`, `app/schemas/`, `app/eventbus/`, `app/api/api_v1/endpoints/`.
- MSFLib packages are consumed as pinned git tags; never `rev = "dev"`.
- Local development uses SQLite (`USE_SQLITE=true`), Redis and Mailpit from
  `docker-compose.yml`.

## Alternatives considered
- Plain FastAPI with MSFLib packages added by hand: rejected; loses the template's tested
  wiring and seeding.
- A non-MSFLib backend: rejected; fails the hackathon's core requirement.

## Consequences
- We inherit the template's conventions (flat env names, one action instance per model,
  hooks registered in `bootstrap.py`).
- The template's dependencies install from `msflib/fastapi`, which requires a git credential
  scoped to `https://github.com/msflib` (configured 2026-10-09).
- We use only the modules the template ships (ADR 0015).
