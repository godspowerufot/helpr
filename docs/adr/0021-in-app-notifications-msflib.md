# 0021. Activity notifications through `msflib-notifications` (in-app inbox)

- Status: Accepted
- Date: 2026-10-09
- Supersedes: ADR 0012 (rejected the module only because of the template-only rule)
- Amends: ADR 0015 (second module beyond the template, after `msflib-payments` in ADR 0019)
- Depends on: ADR 0007, 0019; facts register "Notifications (`msflib-notifications`)"

## Context
The team wants users told about activity on their bookings (a new request, an acceptance,
a payment, a completion) using MSFLib rather than custom code. `msflib-notifications`
(`modules/notifications`, tag `notifications-v0.2.1`) provides `Notification` and
`AccountNotification` tables, `dispatch_account_notifications(...)`, and
`account_notification_router` with a per-account inbox. Its dependencies (core, account,
tenancy) are already in the template; twilio (SMS) is an optional extra we do not install.

## Decision
- Add `msflib-notifications` (`notifications-v0.2.1`). Channel: **`inapp` only** in the MVP.
  Email (Mailpit locally) and SMS are later.
- Mount `account_notification_router(get_session, get_current_account, prefix="/notifications")`.
  Every route needs a signed-in account and only touches the caller's rows:
  `GET /notifications/`, `GET /notifications/{id}`, `PATCH /notifications/{id}/mark?status=`,
  `PATCH /notifications/mark-all?status=`, `DELETE /notifications/{id}`.
  The admin broadcast router is not mounted.
- Helpr sends notifications only through `app/services/notification.py`
  (`notify_accounts(session, receivers, title, message)`), which calls
  `dispatch_account_notifications(..., n_type=NotificationType.system)`.
- `dispatch_account_notifications` **commits**. So it is called after the business change is
  committed (e.g. after `BookingService.transition()` commits), never from MSFLib lifecycle
  pre-commit hooks or the payment-queue listener, which must not commit.
- Where the commit belongs to someone else (the payment-queue listener runs inside MSFLib's
  verify router, which commits after the listener returns), Helpr uses
  `notify_after_commit(session, receivers, title, message)`: it registers a SQLAlchemy
  `after_commit` hook on that session and dispatches in a fresh session once the commit has
  happened; on rollback nothing is sent. The listener itself never commits.
- Which activity notifies whom (wired in M2 with `BookingService`):

| Activity | Receivers | Title |
|---|---|---|
| Booking `requested` | Provider workspace owner + admins | New booking request |
| `accepted` | Customer | Booking accepted. Pay to confirm |
| `declined` | Customer | Booking declined |
| `paid` (Paystack verify) | Provider owner + admins | Booking paid |
| `completed` | Customer | Job completed. Leave a review |
| `cancelled` | The other party | Booking cancelled |
| Review created | Provider owner + admins | New review |

- Booking screens keep the 20-second auto-refresh from ADR 0012; the inbox (bell + unread
  count) uses the same interval. No WebSockets.

## Alternatives considered
- Keep ADR 0012 (refresh only, no inbox): rejected at the team's request.
- Hook `account-create-pre-commit` / post-commit lifecycle events to send notifications:
  rejected; dispatch commits inside the signup transaction and a failure would break signup.
- Email/SMS channels now: deferred; SMS needs Twilio credentials and declared settings (#274).

## Consequences
- `backend/pyproject.toml` differs from the template by two lines (`msflib-payments`,
  `msflib-notifications`). Checkpoint 0.7 checks exactly that.
- Notification tables live in MSFLib; the frontend reads `AccountNotificationRead`
  (`id`, `receiver_id`, `notification_id`, `is_read`, `notification{title, message, ...}`).
- `GET /notifications/` has no ordering guarantee and no unread filter; the frontend sorts by
  `created_at` and counts `is_read == false` itself.
