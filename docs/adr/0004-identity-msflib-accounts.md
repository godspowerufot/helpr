# 0004. One MSFLib account per person; customers and providers share identity

- Status: Accepted
- Date: 2026-10-09
- Depends on: facts register "Identity and auth"

## Context
Helpr has two sides: customers who book and providers who sell. MSFLib accounts are
independent of tenants and workspaces, and auth gives us login, logout, password reset and
open registration (`POST /api/v1/open`).

## Decision
- Every person has exactly one MSFLib `Account`. We do not create a separate customer or
  provider user table.
- Everyone signs up as a customer through MSFLib open registration. Becoming a provider is
  an extra step that creates a provider business (ADR 0005); the same account can do both.
- The account-level `role` stays `user` for everyone except platform admins. We do not use
  account roles to mean "customer" or "provider".
- We do not modify MSFLib's `Account` model in the MVP.

## Alternatives considered
- Separate customer and provider account types: rejected; duplicates identity and blocks
  one person from doing both.
- A `user_type` column on `Account`: rejected for the MVP; requires overriding the model and
  migrations. Provider status is derivable from provider ownership.

## Consequences
- "Is this person a provider?" means "does this account have an active membership in a
  provider workspace?"
- Logout revokes all of an account's tokens until the next login (documented MSFLib
  behaviour). Acceptable for the MVP.
