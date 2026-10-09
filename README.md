# Helpr

A two-sided marketplace for local services, built on [MSFLib](https://msflib.github.io/docsite/).
Customers discover services, compare providers on price and verified reviews, book, and
follow each job from request to completion. Providers publish listings, manage bookings and
track earnings. Customers pay through Paystack (test mode) via msflib-payments.

## Repository

| Path | What |
|---|---|
| `backend/` | FastAPI app from the MSFLib FastAPI template |
| `frontend/` | MSFLib React template app (`@msflib/core`, `react-auth`, `react-components`, `react-workspace`) |
| `docs/` | Proposal, MVP map, frontend guide, MSFLib facts register, ADRs |
| `AGENTS.md` | Rules for coding agents |
| `docker-compose.yml` | Redis, Mailpit, optional Postgres |

## Documentation

- [Proposal](docs/PROPOSAL.md): product, architecture, data model, API contracts
- [MVP map](docs/MVP.md): stories, Checkpoint 0, milestones, demo script
- [Frontend guide](docs/FRONTEND.md): structure, data flow, design tokens, states
- [MSFLib facts register](docs/msflib-facts.md): verified vs assumed MSFLib behaviour
- [Architecture decisions](docs/adr/README.md)

## Run locally

Prerequisites: Python 3.12, Poetry, Node 20+, pnpm, Docker.

```bash
docker compose up -d                 # Redis + Mailpit (http://localhost:8025)

cd backend
cp .env-example .env                 # then edit; see AGENTS.md
poetry install                       # Poetry 1.8.x; needs access to github.com/msflib/fastapi
poetry run python -m app.initial_data
poetry run uvicorn app.main:app --reload    # http://localhost:8000/docs

cd ../frontend
pnpm install                         # needs @msflib GitHub Packages token in ~/.npmrc
pnpm dev                             # http://localhost:3000
```

## Status

Documentation is in place. Both sides use only what the MSFLib templates ship (ADR 0015,
0016). The backend's first `poetry install` is in progress. `frontend/` must be regenerated
from the MSFLib React template (Checkpoint 0.8) before feature work. The next step is
Checkpoint 0 in [`docs/MVP.md`](docs/MVP.md).
