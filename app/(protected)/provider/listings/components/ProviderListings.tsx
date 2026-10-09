'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppConfirmDialog from '@/components/AppConfirmDialog';
import AppEmptyState from '@/components/AppEmptyState';
import TableWidget from '@/dynamics/TableWidget';
import { ROUTES } from '@/constant/routes.constant';
import {
  useProviderListings,
  useSetListingStatus,
} from '@/hooks/provider-workspace.hooks';
import { ProviderListing } from '@/types/listing.types';
import { errorMessage } from '@/utils/error.utils';
import { Card, ErrorState, PageHeader } from '../../../components/Page';
import { listingColumns } from '@/columns/listing.column';

export default function ProviderListings() {
  const { data, isPending, isError, refetch } = useProviderListings();
  const setStatus = useSetListingStatus();
  const [archiving, setArchiving] = useState<ProviderListing | null>(null);

  const run = (row: ProviderListing, action: 'publish' | 'archive') =>
    setStatus.mutate(
      { id: String(row.id), action },
      {
        onSuccess: () => {
          setArchiving(null);
          toast.success(
            action === 'publish'
              ? `“${row.title}” is live.`
              : `“${row.title}” is archived.`
          );
        },
        onError: (error) =>
          toast.error(errorMessage(error, 'That did not work. Try again.')),
      }
    );

  const columns = listingColumns((row) => (
    <div className="flex items-center gap-1">
      <AppButton
        variant="text"
        size="small"
        href={ROUTES.provider.listingManage(row.id)}
      >
        Edit
      </AppButton>
      {row.status === 'published' ? (
        <AppButton
          variant="text"
          size="small"
          onClick={() => setArchiving(row)}
        >
          Archive
        </AppButton>
      ) : (
        <AppButton
          variant="text"
          size="small"
          loading={
            setStatus.isPending && setStatus.variables?.id === String(row.id)
          }
          onClick={() => run(row, 'publish')}
        >
          Publish
        </AppButton>
      )}
    </div>
  ));

  return (
    <>
      <PageHeader
        title="My Services"
        description="Only live services show to customers. Drafts and archived services stay hidden."
        action={
          <AppButton href={ROUTES.provider.listingManage()}>
            Add Service
          </AppButton>
        }
      />
      <Card>
        {isPending ? (
          <AppSkeleton.Text lines={6} />
        ) : isError ? (
          <ErrorState
            message="Your services did not load. Check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : data.length === 0 ? (
          <AppEmptyState message="No services yet. Add what you offer, e.g. deep cleaning, private chef for events, or AC servicing, with a price." />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <TableWidget
                rows={data}
                columns={columns}
                pageSize={10}
                pageSizeOptions={[10, 25]}
                checkboxSelection={false}
                enableSearch
                tableTitle=""
                autoHeight
              />
            </div>
          </div>
        )}
      </Card>

      <AppConfirmDialog
        open={archiving !== null}
        title="Archive this service?"
        message={`“${archiving?.title ?? ''}” disappears from search. Existing bookings are not affected. You can publish it again later.`}
        confirmLabel="Archive Service"
        cancelLabel="Keep Live"
        loading={setStatus.isPending}
        onConfirm={() => archiving && run(archiving, 'archive')}
        onClose={() => setArchiving(null)}
      />
    </>
  );
}
