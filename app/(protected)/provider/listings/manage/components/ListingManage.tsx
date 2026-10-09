'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppConfirmDialog from '@/components/AppConfirmDialog';
import AppEmptyState from '@/components/AppEmptyState';
import FormBuilder from '@/dynamics/FormBuilder';
import { ListingStatusLabel } from '@/columns/listing.column';
import { ROUTES } from '@/constant/routes.constant';
import { useCategories } from '@/hooks/category.hooks';
import {
  useCreateListing,
  useProviderListings,
  useSetListingStatus,
  useUpdateListing,
} from '@/hooks/provider-workspace.hooks';
import { useProviderProfile } from '@/hooks/provider.hooks';
import { ListingWrite, ProviderListing } from '@/types/listing.types';
import { errorMessage } from '@/utils/error.utils';
import { Card, ErrorState, PageHeader } from '../../../../components/Page';
import { ListingForm, listingElements } from '../data/form/listing.form';
import { ListingLayout } from '../data/form/listing.layout';

const back = { href: ROUTES.provider.listings, label: 'My Services' };

const toWrite = (data: ListingForm): ListingWrite => ({
  category_slug: data.category_slug,
  title: data.title.trim(),
  description: data.description.trim(),
  pricing_type: data.pricing_type,
  price_amount: Math.round(Number(data.price_naira) * 100),
  currency: 'NGN',
  duration_minutes: data.duration_minutes
    ? Number(data.duration_minutes)
    : null,
  service_area: data.service_area.trim(),
});

export default function ListingManage() {
  const id = useSearchParams().get('id');
  const listings = useProviderListings();
  const categories = useCategories();
  const profile = useProviderProfile();

  const title = id ? 'Edit Service' : 'Add Service';

  if (listings.isPending || categories.isPending || profile.isPending) {
    return (
      <>
        <PageHeader title={title} back={back} />
        <Card>
          <AppSkeleton.Text lines={8} />
        </Card>
      </>
    );
  }

  if (listings.isError || categories.isError) {
    return (
      <>
        <PageHeader title={title} back={back} />
        <Card>
          <ErrorState
            message="This form did not load. Check your connection and try again."
            onRetry={() => {
              listings.refetch();
              categories.refetch();
            }}
          />
        </Card>
      </>
    );
  }

  const listing = id
    ? listings.data.find((l) => String(l.id) === id)
    : undefined;

  if (id && !listing) {
    return (
      <>
        <PageHeader title="Service not found" back={back} />
        <Card>
          <AppEmptyState
            message="This service does not exist or belongs to another business."
            actionHref={ROUTES.provider.listings}
            actionLabel="My Services"
          />
        </Card>
      </>
    );
  }

  return (
    <ListingEditor
      key={listing?.id ?? 'new'}
      listing={listing}
      categories={categories.data}
      defaultArea={profile.data?.service_area ?? ''}
    />
  );
}

function ListingEditor({
  listing,
  categories,
  defaultArea,
}: {
  listing?: ProviderListing;
  categories: { id: number; slug: string; name: string }[];
  defaultArea: string;
}) {
  const router = useRouter();
  const create = useCreateListing();
  const update = useUpdateListing(String(listing?.id ?? ''));
  const setStatus = useSetListingStatus();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [formData, setFormData] = useState<ListingForm>({
    category_slug: listing?.category.slug ?? '',
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    pricing_type: listing?.pricing_type ?? 'fixed',
    price_naira: listing ? String(listing.price_amount / 100) : '',
    duration_minutes: listing?.duration_minutes
      ? String(listing.duration_minutes)
      : '',
    service_area: listing?.service_area ?? defaultArea,
  });

  const onSubmit = (data: ListingForm) => {
    const body = toWrite(data);
    if (listing) {
      update.mutate(body, {
        onSuccess: () => toast.success('Changes saved.'),
        onError: (error) =>
          toast.error(
            errorMessage(error, 'Your changes were not saved. Try again.')
          ),
      });
      return;
    }
    create.mutate(body, {
      onSuccess: (created) => {
        toast.success('Saved as a draft. Publish it so customers can book it.');
        router.replace(ROUTES.provider.listingManage(created.id));
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, 'The service was not saved. Try again.')
        ),
    });
  };

  const changeStatus = (action: 'publish' | 'archive') =>
    listing &&
    setStatus.mutate(
      { id: String(listing.id), action },
      {
        onSuccess: () => {
          setArchiveOpen(false);
          toast.success(
            action === 'publish' ? 'Service is live.' : 'Service archived.'
          );
        },
        onError: (error) =>
          toast.error(errorMessage(error, 'That did not work. Try again.')),
      }
    );

  return (
    <>
      <PageHeader
        title={listing ? 'Edit Service' : 'Add Service'}
        back={back}
        description={
          listing
            ? undefined
            : 'New services start as drafts. Publish when the details are right.'
        }
      />

      <div className="flex flex-col gap-4">
        {listing ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1" aria-live="polite">
                <ListingStatusLabel status={listing.status} />
                <p className="b2-r text-text-light">
                  {listing.status === 'published' ? (
                    <>
                      Customers can find and book it.{' '}
                      <Link
                        href={ROUTES.serviceView(listing.id)}
                        className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
                      >
                        View public page
                      </Link>
                    </>
                  ) : (
                    'Hidden from customers.'
                  )}
                </p>
              </div>
              {listing.status === 'published' ? (
                <AppButton
                  variant="outlined"
                  onClick={() => setArchiveOpen(true)}
                >
                  Archive
                </AppButton>
              ) : (
                <AppButton
                  variant="outlined"
                  loading={setStatus.isPending}
                  onClick={() => changeStatus('publish')}
                >
                  Publish
                </AppButton>
              )}
            </div>
          </Card>
        ) : null}

        <Card title="Details">
          <FormBuilder
            elements={listingElements(
              categories,
              listing ? 'Save Changes' : 'Save Draft'
            )}
            layout={ListingLayout}
            formData={formData}
            setFormData={setFormData}
            loadingState={create.isPending || update.isPending}
            onSubmit={onSubmit}
          />
        </Card>
      </div>

      <AppConfirmDialog
        open={archiveOpen}
        title="Archive this service?"
        message="It disappears from search. Existing bookings are not affected. You can publish it again later."
        confirmLabel="Archive Service"
        cancelLabel="Keep Live"
        loading={setStatus.isPending}
        onConfirm={() => changeStatus('archive')}
        onClose={() => setArchiveOpen(false)}
      />
    </>
  );
}
