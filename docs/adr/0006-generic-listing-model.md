# 0006. Generic service listing model

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0005, ADR 0011

## Context
Helpr covers many service types (cleaning, plumbing, hair, tutoring). Per-category schemas
would multiply tables and forms for little demo value.

## Decision
One `Listing` table for all services:

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `provider_workspace_id` | int, FK `workspace.id` | Owner business |
| `category_id` | int, FK `category.id` | From a seeded, platform-wide `Category` table |
| `title` | str (≤ 120) | |
| `description` | text | |
| `pricing_type` | enum `fixed` \| `hourly` | |
| `price_amount` | int | Minor units (ADR 0011) |
| `currency` | str | `NGN` in the MVP |
| `duration_minutes` | int, nullable | Estimated job length |
| `service_area` | str | City or area, free text in the MVP |
| `status` | enum `draft` \| `published` \| `archived` | Only `published` is public |
| `rating_avg`, `rating_count` | float, int | Denormalised from reviews (ADR 0010) |
| `created_at`, `updated_at` | datetime | |

Categories are our own small table, not MSFLib `workspace_config` categories, because those
are scoped to one workspace and ours are platform-wide.

## Alternatives considered
- Per-category tables or JSON attribute schemas: rejected for the MVP.
- MSFLib `workspace_config` categories: rejected; wrong scope.

## Consequences
Easy discovery and filtering. Category-specific fields, if ever needed, go in a later ADR.
