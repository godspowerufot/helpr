'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import AppEmptyState from '@/components/AppEmptyState';
import AppStatus from '@/components/AppStatus';
import { CLOSED_STATUSES, OPEN_STATUSES } from '@/constant/booking.constant';
import { ROUTES } from '@/constant/routes.constant';
import { useMyBookings } from '@/hooks/booking.hooks';
import { BookingSummary } from '@/types/booking.types';
import { formatDateTime } from '@/utils/date.utils';
import { formatMoney } from '@/utils/money.utils';
import { Card, ErrorState, PageHeader } from '../../components/Page';

const TABS = [
  { id: 'active', label: 'Active', statuses: OPEN_STATUSES },
  { id: 'past', label: 'Past', statuses: CLOSED_STATUSES },
] as const;

export default function BookingList() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'past' ? 'past' : 'active';
  const { data, isPending, isError, refetch } = useMyBookings();

  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  const rows = (data ?? [])
    .filter((b) => (current.statuses as readonly string[]).includes(b.status))
    .sort((a, b) =>
      tab === 'active'
        ? a.scheduled_for.localeCompare(b.scheduled_for)
        : b.scheduled_for.localeCompare(a.scheduled_for)
    );
  const dueCount = (data ?? []).filter((b) => b.status === 'accepted').length;

  return (
    <>
      <PageHeader
        title="My Bookings"
        description={
          dueCount > 0 ? (
            <span className="text-text">
              {dueCount === 1
                ? '1 booking is accepted and waiting for payment.'
                : `${dueCount} bookings are accepted and waiting for payment.`}
            </span>
          ) : (
            'Requests you have sent, upcoming jobs and your history.'
          )
        }
      />

      <nav aria-label="Booking filters" className="mb-4 flex gap-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={
                t.id === 'active'
                  ? ROUTES.bookings.list
                  : `${ROUTES.bookings.list}?tab=past`
              }
              aria-current={active ? 'page' : undefined}
              className={`b2-m inline-flex min-h-11 items-center rounded-btn-radius px-4 transition-colors duration-150 motion-reduce:transition-none ${
                active
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-light hover:text-text'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Card>
        {isPending ? (
          <AppSkeleton.Text lines={6} />
        ) : isError ? (
          <ErrorState
            message="Your bookings did not load. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <AppEmptyState
            message={
              tab === 'active'
                ? 'No active bookings. Find a cleaner, chef or artisan near you and send a request.'
                : 'No past bookings yet. Completed, declined and cancelled bookings show here.'
            }
            actionHref={tab === 'active' ? ROUTES.services : undefined}
            actionLabel={tab === 'active' ? 'Find Help' : undefined}
          />
        ) : (
          <ul className="-my-3 divide-y divide-stroke-light">
            {rows.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function BookingRow({ booking }: { booking: BookingSummary }) {
  return (
    <li>
      <Link
        href={ROUTES.bookings.view(booking.id)}
        className="-mx-2 flex flex-col gap-2 rounded-card px-2 py-3 transition-colors duration-150 hover:bg-background-light focus-visible:bg-background-light motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0">
          <p className="b1-m truncate text-text">{booking.listing.title}</p>
          <p className="b2-r truncate text-text-light">
            {booking.provider.display_name} ·{' '}
            <time dateTime={booking.scheduled_for} className="tabular-nums">
              {formatDateTime(booking.scheduled_for)}
            </time>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <AppStatus status={booking.status} />
          <span className="b2-m text-text tabular-nums">
            {formatMoney(booking.price_amount, booking.currency)}
          </span>
        </div>
      </Link>
    </li>
  );
}
