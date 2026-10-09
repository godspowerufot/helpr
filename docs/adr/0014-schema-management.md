# 0014. `create_all` for the MVP, Alembic baseline before deployment

- Status: Proposed
- Date: 2026-10-09
- Depends on: facts register "No Alembic revisions exist"

## Context
The template creates tables from model metadata via `python -m app.initial_data`. Note that
`init_db(create_tables=True)` **drops all tables first**. Alembic is configured with no
revisions.

## Decision
- During the hackathon, schema changes are applied by recreating the local SQLite database
  and re-running the seed.
- Before any shared or deployed environment exists, generate one Alembic baseline revision
  covering MSFLib and Helpr tables, and use migrations from then on.

## Alternatives considered
- Alembic from day one: rejected for the 24-hour build; the schema changes hourly.

## Consequences
Local data is disposable. The seed script must produce a complete demo dataset.
