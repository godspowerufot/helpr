import { EVENT_LABEL } from '@/constant/booking.constant';
import { BookingEvent } from '@/types/booking.types';
import { formatDateTime } from '@/utils/date.utils';

const ACTOR: Record<BookingEvent['actor_role'], string> = {
  customer: 'Customer',
  provider: 'Provider',
  system: 'Helpr',
};

interface AppBookingTimelineProps {
  events: BookingEvent[];
}

export default function AppBookingTimeline({
  events,
}: AppBookingTimelineProps) {
  const ordered = [...events].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => (
        <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < ordered.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[5px] top-4 h-[calc(100%-12px)] w-px bg-stroke-light"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-primary bg-surface"
          />
          <div className="min-w-0">
            <p className="b2-m text-text">{EVENT_LABEL[event.to_status]}</p>
            <p className="f1-r text-text-light">
              {ACTOR[event.actor_role]} ·{' '}
              <time dateTime={event.created_at} className="tabular-nums">
                {formatDateTime(event.created_at)}
              </time>
            </p>
            {event.reason ? (
              <p className="b2-r mt-1 break-words text-text-light">
                “{event.reason}”
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
