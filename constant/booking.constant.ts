import { BookingStatus } from '@/types/booking.types';

// Labels and tokens from FRONTEND.md §6. Colour is never the only signal: the label always shows.
export const BOOKING_STATUS: Record<
  BookingStatus,
  { label: string; dot: string; text: string }
> = {
  requested: {
    label: 'Waiting for provider',
    dot: 'bg-text-light',
    text: 'text-text-light',
  },
  accepted: {
    label: 'Accepted · payment due',
    dot: 'bg-warning',
    text: 'text-text',
  },
  paid: { label: 'Paid · scheduled', dot: 'bg-text', text: 'text-text' },
  completed: { label: 'Completed', dot: 'bg-success', text: 'text-text' },
  declined: { label: 'Declined', dot: 'bg-disabled', text: 'text-disabled' },
  cancelled: { label: 'Cancelled', dot: 'bg-disabled', text: 'text-disabled' },
};

// Provider-side wording for the same states.
export const PROVIDER_STATUS_LABEL: Record<BookingStatus, string> = {
  requested: 'New request',
  accepted: 'Accepted · awaiting payment',
  paid: 'Paid · to do',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const OPEN_STATUSES: BookingStatus[] = ['requested', 'accepted', 'paid'];
export const CLOSED_STATUSES: BookingStatus[] = [
  'completed',
  'declined',
  'cancelled',
];

export const EVENT_LABEL: Record<BookingStatus, string> = {
  requested: 'Booking requested',
  accepted: 'Provider accepted',
  declined: 'Provider declined',
  cancelled: 'Booking cancelled',
  paid: 'Payment received',
  completed: 'Job completed',
};

// Start times offered by the booking wizard, every 30 minutes from 07:00 to 19:00.
export const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const minutes = 7 * 60 + i * 30;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
});
