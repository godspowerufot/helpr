import {
  BOOKING_STATUS,
  PROVIDER_STATUS_LABEL,
} from '@/constant/booking.constant';
import { BookingStatus } from '@/types/booking.types';

interface AppStatusProps {
  status: BookingStatus;
  audience?: 'customer' | 'provider';
}

export default function AppStatus({
  status,
  audience = 'customer',
}: AppStatusProps) {
  const tone = BOOKING_STATUS[status];
  const label =
    audience === 'provider' ? PROVIDER_STATUS_LABEL[status] : tone.label;

  return (
    <span className={`b2-m inline-flex items-center gap-2 ${tone.text}`}>
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${tone.dot}`}
      />
      {label}
    </span>
  );
}
