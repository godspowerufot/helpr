# 0029. Google sign-in through MSFLib auth

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0004, 0015, 0016

## Context

The project owner wants "Continue with Google" on log in and sign up, and supplied a Google
OAuth client (ID and secret) for local development. MSFLib auth ships Google OAuth routes and
the React components ship a button and a callback handler (`docs/msflib-facts.md`, Identity
and auth), so no extra package is needed.

## Decision

- Backend settings live only in the git-ignored `backend/.env`: `ENABLE_GOOGLE_OAUTH`,
  `ALLOW_GOOGLE_OAUTH_SIGNUP`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
  `GOOGLE_REDIRECT_URI`. The client secret never goes into a `NEXT_PUBLIC_` variable.
- `app/main.py` adds Starlette `SessionMiddleware` (signed with `SECRET_KEY`, `SameSite=Lax`)
  because MSFLib's `/google/login` keeps the OAuth state in the session.
- New Google users: a listener on `google-account-create`
  (`app/services/google_auth.py`, registered in `app/eventbus/`) creates the account with
  `account_action.create` and a random password, then emits `account-created`. It does not
  call `create_account`, which would email the random password. Workspace hooks still run on
  `account-create-pre-commit`. A Google account is the same single account type as any other
  (ADR 0004); it can sign in with Google or set a password through "Forgot password".
- Frontend: `GoogleLoginButton` (`GoogleAuthButton`) on `/login` and `/register` sends the user
  to Google with `redirect_uri = NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (`http://localhost:3000/login`
  locally). Before leaving it saves the post-login destination in `sessionStorage`
  (`helpr.google-next`): the Provider tab's `/provider/onboard`, or a safe `?next`.
- `/login` mounts `GoogleCallback` (`GoogleAuthHandler`). On success it stores the token exactly
  as `useAuth().login` does (`storage.setItem(getApplicationConfig().accessTokenKey, …)`, then
  invalidates `authQueryKeys.me()`), because `react-auth` has no token setter. Google's
  `?error=` (cancelled) and a failed exchange show a toast and return to a clean `/login`.

## Alternatives considered

- Google Identity Services in the browser with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: a second auth
  path outside MSFLib, and it would still need a backend exchange.
- Using `create_account` in the listener: emails a password the user never chose.
- A local auth context to hold the Google token: forbidden by the template guide; MSFLib's own
  storage key keeps `useAuth()` the single source of truth.

## Consequences

- The Google Cloud OAuth client must list `http://localhost:3000/login` as an authorized
  redirect URI (and the deployed URL later). The redirect URI must match on both sides.
- If MSFLib changes how `react-auth` stores the token, `GoogleCallback` must follow; the
  coupling is limited to `accessTokenKey` and the `me` query key.
- The secret was shared in chat during development; rotate it before any real deployment.
