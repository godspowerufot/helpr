# 0013. Bearer token in localStorage for the MVP

- Status: Accepted
- Date: 2026-10-09
- Depends on: facts register "Identity and auth"

## Context
MSFLib auth issues a JWT from `POST /login` and expects `Authorization: Bearer`. The
frontend and backend run on different origins (`localhost:3000`, `localhost:8000`), and CORS
for `localhost:3000` is configured in `backend/.env`.

## Decision
- Store the access token in `localStorage` under `helpr_access_token`, written and read only
  by `@msflib/react-auth` / `@msflib/core` `storage` (`accessTokenKey` in
  `configureApplication`, ADR 0016). Helpr code never touches the token directly.
- Attach it as a bearer header on every request. On 401, clear it and redirect to `/login`.
- Never render untrusted HTML (no `dangerouslySetInnerHTML` with user content), which limits
  the XSS exposure this choice creates.

## Alternatives considered
- httpOnly cookie via a Next.js route-handler proxy: more secure against XSS, but adds a
  server layer and CSRF handling. Planned for after the MVP.

## Consequences
Simple and matches MSFLib's documented client. Known risk: any XSS can read the token.
