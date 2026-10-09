'use client';

import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppEmptyState from '@/components/AppEmptyState';
import { LISTING_PAGE_SIZE } from '@/constant/listing.constant';
import { ROUTES } from '@/constant/routes.constant';
import {
  listingHref,
  useListingQuery,
  useListings,
} from '@/hooks/listing.hooks';
import { GLASS_CARD } from '@/styles/glass.styles';
import { ListingCard } from '@/types/listing.types';
import { serviceCountLabel } from '@/utils/listing.utils';
import ServiceCard from './ServiceCard';

const GRID = 'mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2';

function CardSkeleton() {
  return (
    <li className={`${GLASS_CARD} overflow-hidden`}>
      <AppSkeleton.Image width="100%" height={80} />
      <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
        <AppSkeleton.Avatar size={48} />
        <AppSkeleton.Text lines={3} />
      </div>
    </li>
  );
}

interface ListingResultsProps {
  activeId?: number;
  onPreview: (listing: ListingCard, immediate?: boolean) => void;
  onPreviewEnd: () => void;
}

export default function ListingResults({
  activeId,
  onPreview,
  onPreviewEnd,
}: ListingResultsProps) {
  const { form, query, hasFilters, offset, near, view } = useListingQuery();
  const { data, isLoading, isError, isFetching, refetch } = useListings(query);

  if (isLoading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="b2-r text-text-light">Loading services…</p>
        <ul className={GRID} aria-hidden="true">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ul>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3" role="alert">
        <p className="b1-r text-error">
          Services could not be loaded. Check your connection and try again.
        </p>
        <AppButton variant="outlined" onClick={() => refetch()}>
          Try Again
        </AppButton>
      </div>
    );
  }

  const start = data.total === 0 ? 0 : offset + 1;
  const end = offset + data.items.length;
  const range =
    data.total === 0
      ? 'No services'
      : offset === 0 && end === data.total
        ? `Showing ${serviceCountLabel(data.total)}`
        : `Showing ${start}–${end} of ${serviceCountLabel(data.total)}`;

  return (
    <section aria-labelledby="services-count" aria-busy={isFetching}>
      <h2
        id="services-count"
        className="b2-m text-text-light tabular-nums"
        aria-live="polite"
      >
        {range}
        {near?.radius_km ? <span> within {near.radius_km} km</span> : null}
        {isFetching ? <span> · Updating…</span> : null}
      </h2>
      {data.items.length === 0 ? (
        <div className="mt-4">
          <AppEmptyState
            message={
              hasFilters
                ? 'No published services match this search.'
                : near
                  ? 'No services within this distance. Choose a wider radius on the map.'
                  : 'No services are published yet.'
            }
            actionHref={hasFilters ? ROUTES.services : undefined}
            actionLabel={hasFilters ? 'Clear Filters' : undefined}
          />
        </div>
      ) : (
        <ul className={GRID}>
          {data.items.map((listing) => (
            <ServiceCard
              key={listing.id}
              listing={listing}
              active={listing.id === activeId}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </ul>
      )}
      {data.total > LISTING_PAGE_SIZE ? (
        <div className="mt-6 flex gap-3">
          <AppButton
            variant="outlined"
            disabled={offset === 0}
            href={
              offset === 0
                ? undefined
                : listingHref(form, offset - LISTING_PAGE_SIZE, near, view)
            }
          >
            Previous
          </AppButton>
          <AppButton
            variant="outlined"
            disabled={offset + LISTING_PAGE_SIZE >= data.total}
            href={
              offset + LISTING_PAGE_SIZE >= data.total
                ? undefined
                : listingHref(form, offset + LISTING_PAGE_SIZE, near, view)
            }
          >
            Next
          </AppButton>
        </div>
      ) : null}
    </section>
  );
}
