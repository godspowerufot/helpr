// Destination stored on the message because the inbox payload has no link field (ADR 0031).
const MARKER = /\n?\[\[helpr:(\/[^\]]+)\]\]\s*$/;

const CUSTOMER_BOOKING = /^\/bookings\/view\?id=\d+$/;
const PROVIDER_BOOKING =
  /^\/provider\/bookings\/view\?id=\d+&workspace=[a-z0-9-]+$/;

export function notificationMessage(message: string, href: string): string {
  return `${message}\n[[helpr:${href}]]`;
}

export function notificationDestination(message: string): {
  text: string;
  href: string | null;
} {
  const match = message.match(MARKER);
  if (!match) return { text: message, href: null };
  const href = match[1];
  const safe =
    CUSTOMER_BOOKING.test(href) || PROVIDER_BOOKING.test(href) ? href : null;
  return { text: message.replace(MARKER, '').trimEnd(), href: safe };
}
