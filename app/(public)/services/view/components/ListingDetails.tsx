'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppPrice from '@/components/AppPrice';
import AppRating from '@/components/AppRating';
import { ROUTES } from '@/constant/routes.constant';
import { useListing } from '@/hooks/listing.hooks';
import { formatDuration } from '@/utils/listing.utils';
import ServicesFrame from '../../components/ServicesFrame';
import { GLASS_CARD } from '@/styles/glass.styles';

export default function ListingDetails() {
  const id = useSearchParams().get('id');
  const validId = Boolean(id && /^\d+$/.test(id));
  const { data, isLoading, isError, refetch } = useListing(id);

  if (!validId) {
    return (
      <ServicesFrame>
        <p className="b1-r text-text-light">Choose a service from the list.</p>
        <AppButton variant="text" href={ROUTES.services}>
          All Services
        </AppButton>
      </ServicesFrame>
    );
  }

  if (isLoading) {
    return (
      <ServicesFrame>
        <p className="b2-r text-text-light">Loading service…</p>
        <div className="mt-4">
          <AppSkeleton.Text lines={6} />
        </div>
      </ServicesFrame>
    );
  }

  if (isError || !data) {
    return (
      <ServicesFrame>
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="b1-r text-error">
            This service could not be loaded. It may be unpublished.
          </p>
          <AppButton variant="outlined" onClick={() => refetch()}>
            Try Again
          </AppButton>
          <AppButton variant="text" href={ROUTES.services}>
            All Services
          </AppButton>
        </div>
      </ServicesFrame>
    );
  }

  const duration = formatDuration(data.duration_minutes);

  return (
    <ServicesFrame>
      <Link
        href={ROUTES.services}
        className="b2-m inline-flex min-h-11 items-center text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
      >
        All Services
      </Link>
      <article className={`${GLASS_CARD} mt-4 p-6 sm:p-10`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="h1-r max-w-[20ch] text-balance text-text">
            {data.title}
          </h1>
          <AppPrice
            amount={data.price_amount}
            currency={data.currency}
            pricingType={data.pricing_type}
          />
        </div>
        <p className="b1-r mt-4 text-text-light">
          <Link
            href={ROUTES.providerView(data.provider.slug)}
            className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
          >
            {data.provider.display_name}
          </Link>
          {' · '}
          {data.service_area}
          {duration ? ` · ${duration}` : ''}
          {' · '}
          {data.category.name}
          {' · '}
          {data.pricing_type === 'hourly' ? 'Hourly' : 'Fixed price'}
        </p>
        <p className="mt-3">
          <AppRating average={data.rating_avg} count={data.rating_count} />
        </p>
        <p className="b1-r mt-6 max-w-[65ch] border-t border-ink/10 pt-6 text-text">
          {data.description}
        </p>
        <div className="mt-6 flex flex-col items-start gap-2 border-t border-ink/10 pt-6">
          <AppButton href={ROUTES.bookings.create(data.id)}>
            Request Booking
          </AppButton>
          <p className="b2-r text-text-light">
            Pick a date and address. You pay only after{' '}
            {data.provider.display_name} accepts.
          </p>
        </div>
      </article>
    </ServicesFrame>
  );
}
