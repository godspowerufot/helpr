'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppRating from '@/components/AppRating';
import { ROUTES } from '@/constant/routes.constant';
import { useProvider } from '@/hooks/provider.hooks';
import { GLASS_CARD } from '@/styles/glass.styles';
import { formatDate } from '@/utils/date.utils';
import { serviceCountLabel } from '@/utils/listing.utils';
import { mediaUrl } from '@/utils/media.utils';
import ServiceCard from '../../../services/components/ServiceCard';
import ServicesFrame from '../../../services/components/ServicesFrame';

const backLink = (
  <Link
    href={ROUTES.services}
    className="b2-m inline-flex min-h-11 items-center text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
  >
    All Services
  </Link>
);

export default function ProviderDetails() {
  const slug = useSearchParams().get('slug');
  const { data, isLoading, isError, refetch } = useProvider(slug);

  if (!slug) {
    return (
      <ServicesFrame>
        <p className="b1-r text-text-light">
          Choose a provider from a service page.
        </p>
        <AppButton variant="text" href={ROUTES.services}>
          All Services
        </AppButton>
      </ServicesFrame>
    );
  }

  if (isLoading) {
    return (
      <ServicesFrame>
        <p className="b2-r text-text-light">Loading provider…</p>
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
            This provider could not be loaded. They may have no live services.
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

  return (
    <ServicesFrame>
      {backLink}
      <article className={`${GLASS_CARD} mt-4 p-6 sm:p-10`}>
        {data.photo_url ? (
          <Image
            src={mediaUrl(data.photo_url)}
            alt={`${data.display_name} business photo`}
            width={144}
            height={144}
            loading="eager"
            fetchPriority="high"
            className="mb-6 size-28 rounded-card object-cover sm:size-36"
          />
        ) : null}
        <h1 className="h1-r max-w-[20ch] text-balance break-words text-text">
          {data.display_name}
        </h1>
        <p className="b1-r mt-4 text-text-light">
          {data.service_area}
          {' · '}
          {serviceCountLabel(data.listings.length)}
        </p>
        <p className="mt-3">
          <AppRating average={data.rating_avg} count={data.rating_count} />
        </p>
        {data.bio ? (
          <p className="b1-r mt-6 max-w-[65ch] whitespace-pre-line break-words border-t border-ink/10 pt-6 text-text">
            {data.bio}
          </p>
        ) : null}
      </article>

      {data.photos.length > 0 ? (
        <section aria-labelledby="provider-work" className="mt-10">
          <h2 id="provider-work" className="h3-r text-text">
            Recent work
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.photos.map((photo, index) => (
              <li key={photo.id} className="min-w-0">
                <figure className="flex flex-col gap-2">
                  <Image
                    src={mediaUrl(photo.url)}
                    alt={
                      photo.caption ||
                      `${data.display_name} work photo ${index + 1}`
                    }
                    width={400}
                    height={300}
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-card object-cover"
                  />
                  {photo.caption ? (
                    <figcaption className="f1-r break-words text-text-light">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="provider-services" className="mt-10">
        <h2 id="provider-services" className="h3-r text-text">
          Services
        </h2>
        {data.listings.length === 0 ? (
          <p className="b1-r mt-4 text-text-light">
            No live services right now.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.listings.map((listing) => (
              <ServiceCard key={listing.id} listing={listing} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="provider-reviews" className="mt-10">
        <h2 id="provider-reviews" className="h3-r text-text">
          Recent reviews
        </h2>
        {data.recent_reviews.length === 0 ? (
          <p className="b1-r mt-4 text-text-light">
            No reviews yet. Reviews come from customers after a completed job.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {data.recent_reviews.map((review) => (
              <li key={review.id} className={`${GLASS_CARD} p-5`}>
                <p className="b2-m text-text tabular-nums">
                  {review.rating} out of 5 · {review.customer_name}
                </p>
                {review.comment ? (
                  <p className="b1-r mt-2 max-w-[65ch] break-words text-text">
                    {review.comment}
                  </p>
                ) : null}
                <p className="f1-r mt-2 text-text-light">
                  <time dateTime={review.created_at}>
                    {formatDate(review.created_at)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ServicesFrame>
  );
}
