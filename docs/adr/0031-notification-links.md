# 0031. Activity notifications link to the booking they describe

- Status: Accepted
- Date: 2026-10-09
- Depends on: ADR 0021; facts register "Notifications (`msflib-notifications`)"

## Context
The inbox row only marked itself read. A customer whose booking was accepted could not
open that booking, and a provider could not open the request, from the notification.

`Notification` has no link or metadata column. `NotificationCreate` is `title`, `message`
and `channels`. `dispatch_account_notifications` overwrites `scope` to `"account"`, so that
field cannot carry a path. The inbox is MSFLib's `account_notification_router`; Helpr does
not replace it.

## Decision
- Each activity message ends with a destination marker the inbox does not display:
  `[[helpr:/bookings/view?id={booking_id}]]` for the customer, and
  `[[helpr:/provider/bookings/view?id={booking_id}&workspace={slug}]]` for the provider's
  owner and admins.
- `with_link` rejects anything that is not one of those two paths.
- The bell row is a link to that path. Opening it marks the row read.
- A provider link's `workspace` query selects that business before its bookings load.
- Rows stored before this marker existed are filled in by `link_unlinked_notifications`,
  matching `Booking #id` or the quoted listing title plus the receiver. The marketplace
  seeder runs that on every seed, including when the businesses already exist.

## Alternatives considered
- A Helpr table of notification id to path, plus our own inbox route: rejected; it replaces
  the MSFLib inbox ADR 0021 mounts.
- Putting the path in `scope`: rejected; dispatch forces `scope` to `"account"`.
- Guessing the page from the title alone: rejected; several bookings can share a title, so
  the click would not open the booking the sentence is about.

## Consequences
- The human sentence and the marker travel in `message`. The UI strips the marker before
  showing the text.
- A notification with no marker still marks itself read and does not navigate.
