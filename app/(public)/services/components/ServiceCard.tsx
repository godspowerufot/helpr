import Link from 'next/link';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { ROUTES } from '@/constant/routes.constant';
import { GLASS_CARD } from '@/styles/glass.styles';
import { ListingCard } from '@/types/listing.types';
import { accountInitials } from '@/utils/account.utils';
import { formatDistance } from '@/utils/geo.utils';
import { formatDuration } from '@/utils/listing.utils';
import { formatMoney } from '@/utils/money.utils';

const statLabel = 'f1-m uppercase tracking-wider text-text-light';

interface ServiceCardProps {
  listing: ListingCard;
  active?: boolean;
  onPreview?: (listing: ListingCard, immediate?: boolean) => void;
  onPreviewEnd?: () => void;
}

export default function ServiceCard({
  listing,
  active = false,
  onPreview,
  onPreviewEnd,
}: ServiceCardProps) {
  const duration = formatDuration(listing.duration_minutes);
  const footnote =
    listing.distance_km != null
      ? formatDistance(listing.distance_km)
      : duration;

  return (
    <li className="min-w-0">
      <Link
        href={ROUTES.serviceView(listing.id)}
        onMouseEnter={() => onPreview?.(listing)}
        onMouseLeave={onPreviewEnd}
        onFocus={() => onPreview?.(listing, true)}
        className={`${GLASS_CARD} group relative flex h-full flex-col overflow-hidden transition-[background-color,border-color] duration-200 hover:border-glass hover:bg-glass/70 ${active ? 'lg:border-ink/60' : ''}`}
      >
        <div
          aria-hidden="true"
          className="h-20 bg-[image:var(--card-banner)]"
        />

        <div className="flex flex-1 flex-col px-5 pb-5">
          <span
            aria-hidden="true"
            className="-mt-8 flex size-16 items-center justify-center rounded-modal border border-glass/70 bg-glass shadow-glass"
          >
            <span className="h6-b flex size-12 items-center justify-center rounded-card bg-ink text-glass">
              {accountInitials(listing.provider.display_name)}
            </span>
          </span>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h3 className="h5-b min-w-0 line-clamp-2 break-words text-pretty text-text">
              {listing.title}
            </h3>
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-glass/80 bg-glass/60 text-ink transition-[background-color,color] duration-200 group-hover:bg-ink group-hover:text-glass"
            >
              <ChevronRightRounded fontSize="small" />
            </span>
          </div>

          <p className="mt-1 flex min-w-0 items-center gap-2">
            <span className="f1-m shrink-0 rounded-full bg-ink/5 px-2 py-0.5 uppercase tracking-wider text-ink">
              {listing.category.name}
            </span>
            <span className="f1-r min-w-0 truncate text-text-light">
              {listing.provider.display_name}
            </span>
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-ink/10 pt-4">
            <div className="min-w-0">
              <dt className={statLabel}>Price</dt>
              <dd className="b1-b mt-1 truncate tabular-nums text-text">
                {formatMoney(listing.price_amount, listing.currency)}
                {listing.pricing_type === 'hourly' ? (
                  <span className="f1-r text-text-light"> / hour</span>
                ) : null}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className={statLabel}>Rating</dt>
              <dd className="b1-b mt-1 tabular-nums text-text">
                {listing.rating_count === 0 ? (
                  'New'
                ) : (
                  <>
                    {listing.rating_avg.toFixed(1)}
                    <span className="f1-r text-text-light">
                      {' '}
                      ({listing.rating_count})
                    </span>
                  </>
                )}
              </dd>
            </div>
          </dl>

          <p className="f1-r mt-auto flex justify-between gap-3 pt-4 text-text-light">
            <span className="min-w-0 truncate">{listing.service_area}</span>
            {footnote ? (
              <span className="shrink-0 tabular-nums">{footnote}</span>
            ) : null}
          </p>
        </div>

        <span className="f1-m absolute right-3 top-3 rounded-full border border-glass/40 bg-glass/15 px-2.5 py-0.5 uppercase tracking-wider text-glass backdrop-blur-md">
          {listing.pricing_type === 'hourly' ? 'Hourly' : 'Fixed Price'}
        </span>
      </Link>
    </li>
  );
}
