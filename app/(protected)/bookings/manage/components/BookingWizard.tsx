'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppEmptyState from '@/components/AppEmptyState';
import AppPaymentNotice from '@/components/AppPaymentNotice';
import FormBuilder from '@/dynamics/FormBuilder';
import { ROUTES } from '@/constant/routes.constant';
import { useCreateBooking } from '@/hooks/booking.hooks';
import { useListing } from '@/hooks/listing.hooks';
import { useDeviceLocation } from '@/hooks/map.hooks';
import { useProvider, useProviderBlockedDays } from '@/hooks/provider.hooks';
import { ListingCard } from '@/types/listing.types';
import {
  formatDateKey,
  formatDateTime,
  localDateTimeToIso,
} from '@/utils/date.utils';
import { errorMessage, errorStatus } from '@/utils/error.utils';
import { formatDuration } from '@/utils/listing.utils';
import { formatMoney } from '@/utils/money.utils';
import {
  Card,
  DetailRow,
  ErrorState,
  PageHeader,
} from '../../../components/Page';
import {
  serviceElements,
  whenElements,
  whereElements,
} from '../data/form/booking.form';
import {
  StepContext,
  StepLayout,
  WhenLayout,
} from '../data/form/booking.layout';

type Draft = {
  listing_id: string;
  date: string;
  time: string;
  address: string;
  notes: string;
};

const STEPS = [
  { id: 'service', label: 'Service' },
  { id: 'when', label: 'Date & time' },
  { id: 'where', label: 'Address & notes' },
  { id: 'review', label: 'Review' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export default function BookingWizard() {
  const listingId = useSearchParams().get('listing_id');
  const listing = useListing(listingId);
  const provider = useProvider(listing.data?.provider.slug);

  if (!listingId || listing.isError) {
    return (
      <>
        <PageHeader
          title="Book a service"
          back={{ href: ROUTES.services, label: 'Find Help' }}
        />
        <Card>
          {listingId && listing.isError ? (
            <ErrorState
              message="This service did not load. It may have been removed."
              onRetry={() => listing.refetch()}
            />
          ) : (
            <AppEmptyState
              message="Pick a service first, then request a booking from its page."
              actionHref={ROUTES.services}
              actionLabel="Find Help"
            />
          )}
        </Card>
      </>
    );
  }

  if (listing.isPending || provider.isPending) {
    return (
      <>
        <PageHeader title="Book a service" />
        <Card>
          <AppSkeleton.Text lines={6} />
        </Card>
      </>
    );
  }

  const services: ListingCard[] = provider.data?.listings.length
    ? provider.data.listings
    : [{ ...listing.data, provider: listing.data.provider }];

  return (
    <Wizard
      initialListingId={String(listing.data.id)}
      providerName={listing.data.provider.display_name}
      providerSlug={listing.data.provider.slug}
      services={services}
    />
  );
}

const BLOCKED_DAYS_SHOWN = 6;

/** The native date input cannot grey out days, so the unavailable ones are listed. */
function BlockedDaysNote({
  providerName,
  days,
}: {
  providerName: string;
  days: string[];
}) {
  if (days.length === 0) return null;
  const shown = days.slice(0, BLOCKED_DAYS_SHOWN);
  const more = days.length - shown.length;
  return (
    <div className="mb-5 rounded-card bg-background-light p-4">
      <p className="b2-m text-text">{providerName} is not available on</p>
      <ul className="b2-r mt-1 flex flex-wrap gap-x-3 gap-y-1 text-text-light tabular-nums">
        {shown.map((day) => (
          <li key={day}>
            <time dateTime={day}>{formatDateKey(day)}</time>
          </li>
        ))}
        {more > 0 ? <li>and {more} more</li> : null}
      </ul>
    </div>
  );
}

function Wizard({
  initialListingId,
  providerName,
  providerSlug,
  services,
}: {
  initialListingId: string;
  providerName: string;
  providerSlug: string;
  services: ListingCard[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>('service');
  const [draft, setDraft] = useState<Draft>({
    listing_id: initialListingId,
    date: '',
    time: '',
    address: '',
    notes: '',
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const {
    locate,
    status: locateStatus,
    error: locateError,
  } = useDeviceLocation();
  const create = useCreateBooking();
  const blocked = useProviderBlockedDays(providerSlug);
  const blockedDays = useMemo(() => blocked.data ?? [], [blocked.data]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const dirty = stepIndex > 0 && !create.isSuccess;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const selected =
    services.find((s) => String(s.id) === draft.listing_id) ?? services[0];

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        value: String(s.id),
        label: `${s.title} · ${formatMoney(s.price_amount, s.currency)}${
          s.pricing_type === 'hourly' ? ' / hour' : ''
        }`,
      })),
    [services]
  );

  const next = (data: Partial<Draft>, to: StepId) => {
    setDraft((d) => ({ ...d, ...data }));
    setStep(to);
  };
  const back = (to: StepId) => () => setStep(to);

  const submit = () =>
    create.mutate(
      {
        listing_id: Number(draft.listing_id),
        scheduled_for: localDateTimeToIso(draft.date, draft.time),
        address: draft.address.trim(),
        notes: draft.notes.trim(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      },
      {
        onSuccess: (booking) => {
          toast.success(`Request sent to ${providerName}.`);
          router.push(ROUTES.bookings.view(booking.id));
        },
        onError: (error) => {
          toast.error(
            errorMessage(error, 'Your request was not sent. Try again.')
          );
          if (errorStatus(error) === 409) {
            blocked.refetch();
            setStep('when');
          }
        },
      }
    );

  return (
    <>
      <PageHeader
        title="Book a service"
        description={
          <>
            from{' '}
            <Link
              href={ROUTES.providerView(providerSlug)}
              className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
            >
              {providerName}
            </Link>
            . You pay only after they accept.
          </>
        }
        back={{
          href: ROUTES.serviceView(initialListingId),
          label: 'Back to service',
        }}
      />

      <ol
        className="mb-4 flex flex-wrap gap-x-4 gap-y-2"
        aria-label="Booking steps"
      >
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            aria-current={s.id === step ? 'step' : undefined}
            className={`b2-m flex items-center gap-2 ${
              i === stepIndex
                ? 'text-text'
                : i < stepIndex
                  ? 'text-text-light'
                  : 'text-disabled'
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                i === stepIndex
                  ? 'bg-text text-surface'
                  : 'border border-stroke'
              }`}
            >
              {i + 1}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <Card title={STEPS[stepIndex].label}>
        {step === 'service' ? (
          <StepContext.Provider value={{}}>
            <FormBuilder
              key="service"
              elements={serviceElements(serviceOptions)}
              layout={StepLayout}
              formData={draft}
              onSubmit={(data: Pick<Draft, 'listing_id'>) => next(data, 'when')}
            />
          </StepContext.Provider>
        ) : null}

        {step === 'when' ? (
          <StepContext.Provider value={{ onBack: back('service') }}>
            {blocked.isPending ? (
              <AppSkeleton.Text lines={4} />
            ) : (
              <>
                <BlockedDaysNote
                  providerName={providerName}
                  days={blockedDays}
                />
                <FormBuilder
                  key="when"
                  elements={whenElements(blockedDays)}
                  layout={WhenLayout}
                  formData={draft}
                  onSubmit={(data: Pick<Draft, 'date' | 'time'>) =>
                    next(data, 'where')
                  }
                />
              </>
            )}
          </StepContext.Provider>
        ) : null}

        {step === 'where' ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-start gap-2">
              <AppButton
                variant="outlined"
                loading={locateStatus === 'locating'}
                onClick={async () => {
                  const point = await locate();
                  if (point) setCoords(point);
                }}
              >
                {coords ? 'Update My Location' : 'Share My Location'}
              </AppButton>
              <p className="b2-r text-text-light" aria-live="polite">
                {locateError ??
                  (coords
                    ? 'Location attached. The provider sees how far away the job is.'
                    : 'Optional. Helps the provider see how far away the job is.')}
              </p>
            </div>
            <StepContext.Provider value={{ onBack: back('when') }}>
              <FormBuilder
                key="where"
                elements={whereElements()}
                layout={StepLayout}
                formData={draft}
                onSubmit={(data: Pick<Draft, 'address' | 'notes'>) =>
                  next(
                    { address: data.address, notes: data.notes ?? '' },
                    'review'
                  )
                }
              />
            </StepContext.Provider>
          </div>
        ) : null}

        {step === 'review' ? (
          <div className="flex flex-col gap-5">
            <dl>
              <DetailRow label="Service">{selected.title}</DetailRow>
              <DetailRow label="Provider">{providerName}</DetailRow>
              <DetailRow label="When">
                <span className="tabular-nums">
                  {formatDateTime(localDateTimeToIso(draft.date, draft.time))}
                </span>
              </DetailRow>
              <DetailRow label="Address">{draft.address}</DetailRow>
              {draft.notes.trim() ? (
                <DetailRow label="Notes">{draft.notes}</DetailRow>
              ) : null}
              <DetailRow label="Price">
                <span className="tabular-nums">
                  {formatMoney(selected.price_amount, selected.currency)}
                  {selected.pricing_type === 'hourly' ? ' / hour' : ''}
                </span>
                {selected.duration_minutes ? (
                  <span className="b2-r text-text-light">
                    {' '}
                    · about {formatDuration(selected.duration_minutes)}
                  </span>
                ) : null}
              </DetailRow>
            </dl>
            <div className="flex flex-col gap-1">
              <p className="b2-r text-text">
                Nothing is charged now. {providerName} accepts or declines
                first; then you pay from the booking page.
              </p>
              <AppPaymentNotice />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AppButton loading={create.isPending} onClick={submit}>
                Send Request
              </AppButton>
              <AppButton variant="text" onClick={back('where')}>
                Back
              </AppButton>
            </div>
          </div>
        ) : null}
      </Card>
    </>
  );
}
