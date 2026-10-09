'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import AppEmptyState from '@/components/AppEmptyState';
import TableWidget from '@/dynamics/TableWidget';
import { providerBookingColumns } from '@/columns/provider-booking.column';
import { PROVIDER_STATUS_LABEL } from '@/constant/booking.constant';
import { ROUTES } from '@/constant/routes.constant';
import { useProviderBookings } from '@/hooks/provider-workspace.hooks';
import { BookingStatus } from '@/types/booking.types';
import { Card, ErrorState, PageHeader } from '../../../components/Page';

const FILTERS: { status?: BookingStatus; label: string }[] = [
  { label: 'All' },
  { status: 'requested', label: PROVIDER_STATUS_LABEL.requested },
  { status: 'accepted', label: 'Awaiting payment' },
  { status: 'paid', label: PROVIDER_STATUS_LABEL.paid },
  { status: 'completed', label: PROVIDER_STATUS_LABEL.completed },
  { status: 'declined', label: PROVIDER_STATUS_LABEL.declined },
  { status: 'cancelled', label: PROVIDER_STATUS_LABEL.cancelled },
];

const isStatus = (value: string | null): value is BookingStatus =>
  FILTERS.some((f) => f.status === value);

const filterHref = (status?: BookingStatus) =>
  status
    ? `${ROUTES.provider.bookings}?status=${status}`
    : ROUTES.provider.bookings;

export default function ProviderBookings() {
  const raw = useSearchParams().get('status');
  const status = isStatus(raw) ? raw : undefined;
  const { data, isPending, isError, refetch } = useProviderBookings(
    status ? { status } : {}
  );

  const rows = [...(data ?? [])].sort((a, b) =>
    a.scheduled_for.localeCompare(b.scheduled_for)
  );
  const current = FILTERS.find((f) => f.status === status) ?? FILTERS[0];

  return (
    <>
      <PageHeader
        title="Incoming Bookings"
        description="Accept new requests, then do the job once the customer pays."
      />

      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f.status === status;
          return (
            <Link
              key={f.label}
              href={filterHref(f.status)}
              aria-current={active ? 'page' : undefined}
              className={`b2-m inline-flex min-h-11 items-center rounded-btn-radius px-4 transition-colors duration-150 motion-reduce:transition-none ${
                active
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-light hover:text-text'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <Card>
        {isPending ? (
          <AppSkeleton.Text lines={6} />
        ) : isError ? (
          <ErrorState
            message="Bookings did not load. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : rows.length === 0 ? (
          <AppEmptyState
            message={
              status
                ? `No bookings under “${current.label}”.`
                : 'No bookings yet. Publish a service so customers nearby can book you.'
            }
            actionHref={
              status ? ROUTES.provider.bookings : ROUTES.provider.listings
            }
            actionLabel={status ? 'Show All' : 'My Services'}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <TableWidget
                rows={rows}
                columns={providerBookingColumns}
                pageSize={10}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection={false}
                autoHeight
              />
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
