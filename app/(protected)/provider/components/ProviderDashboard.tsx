'use client';

import Link from 'next/link';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppEmptyState from '@/components/AppEmptyState';
import AppStatus from '@/components/AppStatus';
import { ROUTES } from '@/constant/routes.constant';
import { useProviderBookings } from '@/hooks/provider-workspace.hooks';
import { useEarnings, useProviderProfile } from '@/hooks/provider.hooks';
import { BookingSummary } from '@/types/booking.types';
import { formatDateTime } from '@/utils/date.utils';
import { GLASS_CARD } from '@/styles/glass.styles';
import { formatMoney } from '@/utils/money.utils';
import { Card, ErrorState, PageHeader } from '../../components/Page';

export default function ProviderDashboard() {
  const profile = useProviderProfile();
  const earnings = useEarnings();
  const bookings = useProviderBookings();

  const all = bookings.data ?? [];
  const requests = all.filter((b) => b.status === 'requested');
  const toDo = all
    .filter((b) => b.status === 'paid')
    .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));
  const awaitingPayment = all.filter((b) => b.status === 'accepted').length;

  return (
    <>
      <PageHeader
        title={profile.data?.display_name ?? 'Dashboard'}
        description={
          requests.length > 0
            ? `${requests.length} new ${requests.length === 1 ? 'request needs' : 'requests need'} your answer.`
            : 'Requests, upcoming jobs and earnings for your business.'
        }
        action={
          <AppButton href={ROUTES.provider.listingManage()}>
            Add Service
          </AppButton>
        }
      />

      <div className="flex flex-col gap-4">
        <section
          aria-label="Summary"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Stat
            label="New requests"
            value={bookings.isPending ? null : requests.length}
            href={`${ROUTES.provider.bookings}?status=requested`}
          />
          <Stat
            label="Awaiting payment"
            value={bookings.isPending ? null : awaitingPayment}
            href={`${ROUTES.provider.bookings}?status=accepted`}
          />
          <Stat
            label="Live services"
            value={profile.data?.stats.published_listing_count ?? null}
            href={ROUTES.provider.listings}
          />
          <Stat
            label="Earned"
            value={
              earnings.data
                ? formatMoney(
                    earnings.data.total_amount,
                    earnings.data.currency
                  )
                : null
            }
            hint={
              earnings.data && earnings.data.pending_amount > 0
                ? `${formatMoney(earnings.data.pending_amount, earnings.data.currency)} for paid jobs not yet done`
                : undefined
            }
          />
        </section>

        <Card title="New requests">
          {bookings.isPending ? (
            <AppSkeleton.Text lines={4} />
          ) : bookings.isError ? (
            <ErrorState
              message="Bookings did not load. Check your connection and try again."
              onRetry={() => bookings.refetch()}
            />
          ) : requests.length === 0 ? (
            <AppEmptyState message="No new requests. When a customer books one of your services, it shows here; you have to accept before they can pay." />
          ) : (
            <BookingRows rows={requests} />
          )}
        </Card>

        <Card title="Paid · to do">
          {bookings.isPending ? (
            <AppSkeleton.Text lines={3} />
          ) : bookings.isError ? null : toDo.length === 0 ? (
            <AppEmptyState message="No paid jobs waiting. After a customer pays, the job shows here until you mark it done." />
          ) : (
            <BookingRows rows={toDo} />
          )}
        </Card>

        <Card title="Recent earnings">
          {earnings.isPending ? (
            <AppSkeleton.Text lines={3} />
          ) : earnings.isError ? (
            <ErrorState
              message="Earnings did not load. Try again."
              onRetry={() => earnings.refetch()}
            />
          ) : earnings.data.recent.length === 0 ? (
            <AppEmptyState message="No earnings yet. Paid and completed jobs show here." />
          ) : (
            <ul className="-my-3 divide-y divide-stroke-light">
              {earnings.data.recent.map((entry) => (
                <li
                  key={entry.booking_id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={ROUTES.provider.bookingView(entry.booking_id)}
                      className="b1-m block truncate text-text hover:underline"
                    >
                      {entry.listing_title}
                    </Link>
                    <p className="b2-r truncate text-text-light">
                      {entry.customer_name} ·{' '}
                      {entry.status === 'completed'
                        ? 'Completed'
                        : 'Paid · to do'}
                    </p>
                  </div>
                  <span className="b2-m text-text tabular-nums">
                    {formatMoney(entry.amount, entry.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number | string | null;
  href?: string;
  hint?: string;
}) {
  const body = (
    <>
      <span className="b2-r text-text-light">{label}</span>
      <div className="h4-r text-text tabular-nums">
        {value === null ? <AppSkeleton.Text lines={1} /> : value}
      </div>
      {hint ? <span className="f1-r text-text-light">{hint}</span> : null}
    </>
  );
  const className = `${GLASS_CARD} flex flex-col gap-1 p-5`;
  return href ? (
    <Link
      href={href}
      className={`${className} transition-colors duration-200 hover:bg-glass/70 motion-reduce:transition-none`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function BookingRows({ rows }: { rows: BookingSummary[] }) {
  return (
    <ul className="-my-3 divide-y divide-stroke-light">
      {rows.map((b) => (
        <li key={b.id}>
          <Link
            href={ROUTES.provider.bookingView(b.id)}
            className="-mx-2 flex flex-col gap-2 rounded-card px-2 py-3 transition-colors duration-150 hover:bg-background-light motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="b1-m truncate text-text">{b.listing.title}</p>
              <p className="b2-r truncate text-text-light">
                {b.customer_name} ·{' '}
                <time dateTime={b.scheduled_for} className="tabular-nums">
                  {formatDateTime(b.scheduled_for)}
                </time>{' '}
                · {b.address}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
              <AppStatus status={b.status} audience="provider" />
              <span className="b2-m text-text tabular-nums">
                {formatMoney(b.price_amount, b.currency)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
