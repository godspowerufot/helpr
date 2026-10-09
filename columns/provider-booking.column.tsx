import Link from 'next/link';
import AppStatus from '@/components/AppStatus';
import { ROUTES } from '@/constant/routes.constant';
import { BookingSummary } from '@/types/booking.types';
import { TableColumn } from '@/types/table.types';
import { formatDateTime } from '@/utils/date.utils';
import { formatMoney } from '@/utils/money.utils';

export const providerBookingColumns: TableColumn<BookingSummary>[] = [
  {
    field: 'scheduled_for',
    headerName: 'When',
    width: 160,
    renderCell: ({ row }) => (
      <time dateTime={row.scheduled_for} className="tabular-nums">
        {formatDateTime(row.scheduled_for)}
      </time>
    ),
  },
  {
    field: 'listing',
    headerName: 'Service',
    flex: 2,
    renderCell: ({ row }) => (
      <Link
        href={ROUTES.provider.bookingView(row.id)}
        className="b2-m truncate text-text hover:underline"
      >
        {row.listing.title}
      </Link>
    ),
  },
  {
    field: 'customer_name',
    headerName: 'Customer',
    flex: 1,
  },
  {
    field: 'address',
    headerName: 'Address',
    flex: 1.5,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 200,
    renderCell: ({ row }) => (
      <AppStatus status={row.status} audience="provider" />
    ),
  },
  {
    field: 'price_amount',
    headerName: 'Price',
    width: 120,
    renderCell: ({ row }) => (
      <span className="tabular-nums">
        {formatMoney(row.price_amount, row.currency)}
      </span>
    ),
  },
];
