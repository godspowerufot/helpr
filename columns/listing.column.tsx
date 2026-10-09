import Link from 'next/link';
import { ROUTES } from '@/constant/routes.constant';
import { ListingStatus, ProviderListing } from '@/types/listing.types';
import { TableColumn } from '@/types/table.types';
import { formatMoney } from '@/utils/money.utils';

const STATUS_LABEL: Record<ListingStatus, { label: string; dot: string }> = {
  published: { label: 'Live', dot: 'bg-success' },
  draft: { label: 'Draft · hidden', dot: 'bg-text-light' },
  archived: { label: 'Archived', dot: 'bg-disabled' },
};

export function ListingStatusLabel({ status }: { status: ListingStatus }) {
  const tone = STATUS_LABEL[status];
  return (
    <span className="b2-m inline-flex items-center gap-2 text-text">
      <span aria-hidden="true" className={`size-2 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

export const listingColumns = (
  renderActions: (row: ProviderListing) => React.ReactNode
): TableColumn<ProviderListing>[] => [
  {
    field: 'title',
    headerName: 'Service',
    flex: 2,
    renderCell: ({ row }) => (
      <Link
        href={ROUTES.provider.listingManage(row.id)}
        className="b2-m truncate text-text hover:underline"
      >
        {row.title}
      </Link>
    ),
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 1,
    renderCell: ({ row }) => row.category.name,
  },
  {
    field: 'price_amount',
    headerName: 'Price',
    width: 140,
    renderCell: ({ row }) => (
      <span className="tabular-nums">
        {formatMoney(row.price_amount, row.currency)}
        {row.pricing_type === 'hourly' ? ' / hr' : ''}
      </span>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: ({ row }) => <ListingStatusLabel status={row.status} />,
  },
  {
    field: 'id',
    headerName: 'Actions',
    width: 200,
    sortable: false,
    renderCell: ({ row }) => renderActions(row),
  },
];
