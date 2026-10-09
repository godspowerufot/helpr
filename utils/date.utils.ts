const dateTimeFormat = new Intl.DateTimeFormat('en-NG', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('en-NG', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('en-NG', {
  hour: 'numeric',
  minute: '2-digit',
});

// "Sat 12 Oct, 10:00" (FRONTEND.md §6), in the browser's local time.
export const formatDateTime = (iso: string) =>
  dateTimeFormat.format(new Date(iso));

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

const pad = (n: number) => String(n).padStart(2, '0');

// `YYYY-MM-DD` for the local calendar day (date inputs and blocked-day keys).
export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const regionDayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
});

// `YYYY-MM-DD` of an instant in the service region (ADR 0028 blocked days).
export const toRegionDateKey = (iso: string) =>
  regionDayFormat.format(new Date(iso));

// "Sat 12 Oct 2026" for a `YYYY-MM-DD` key, without shifting the day.
export const formatDateKey = (key: string) =>
  dateFormat.format(new Date(`${key}T12:00:00`));

// Combines a local `YYYY-MM-DD` and `HH:mm` into an ISO instant for the API.
export const localDateTimeToIso = (dateKey: string, time: string) =>
  new Date(`${dateKey}T${time}:00`).toISOString();
