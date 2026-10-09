'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import AppBookingTimeline from '@/components/AppBookingTimeline';
import AppButton from '@/components/AppButton';
import AppConfirmDialog from '@/components/AppConfirmDialog';
import AppEmptyState from '@/components/AppEmptyState';
import AppPaymentNotice from '@/components/AppPaymentNotice';
import AppReasonDialog from '@/components/AppReasonDialog';
import AppStatus from '@/components/AppStatus';
import { ROUTES } from '@/constant/routes.constant';
import {
  useBooking,
  useCancelBooking,
  usePayBooking,
} from '@/hooks/booking.hooks';
import { BookingDetail } from '@/types/booking.types';
import { formatDateTime } from '@/utils/date.utils';
import { errorMessage, errorStatus } from '@/utils/error.utils';
import { formatMoney } from '@/utils/money.utils';
import {
  Card,
  DetailRow,
  ErrorState,
  PageHeader,
} from '../../../components/Page';
import ReviewForm from './ReviewForm';

const back = { href: ROUTES.bookings.list, label: 'My Bookings' };

export default function BookingView() {
  const id = useSearchParams().get('id');
  const { data, isPending, isError, error, refetch } = useBooking(id);

  if (
    !id ||
    !/^\d+$/.test(id) ||
    errorStatus(error) === 404 ||
    errorStatus(error) === 403
  ) {
    return (
      <>
        <PageHeader title="Booking not found" back={back} />
        <Card>
          <AppEmptyState
            message="This booking does not exist or belongs to another account."
            actionHref={ROUTES.bookings.list}
            actionLabel="Back to My Bookings"
          />
        </Card>
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <PageHeader title="Booking" back={back} />
        <Card>
          <AppSkeleton.Text lines={8} />
        </Card>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Booking" back={back} />
        <Card>
          <ErrorState
            message="This booking did not load. Check your connection and try again."
            onRetry={() => refetch()}
          />
        </Card>
      </>
    );
  }

  return <BookingContent booking={data} onStale={() => refetch()} />;
}

const STATUS_HINT: Record<
  BookingDetail['status'],
  (b: BookingDetail) => string
> = {
  requested: (b) =>
    `Waiting for ${b.provider.display_name} to accept. You pay only after they accept.`,
  accepted: (b) =>
    `${b.provider.display_name} accepted. Pay now to lock in the date.`,
  paid: () =>
    'Paid. The job is scheduled; the provider marks it done afterwards.',
  completed: (b) =>
    b.review ? 'Job done. Thanks for your review.' : 'Job done. How did it go?',
  declined: (b) =>
    `${b.provider.display_name} could not take this job. You were not charged.`,
  cancelled: () => 'This booking was cancelled.',
};

function BookingContent({
  booking,
  onStale,
}: {
  booking: BookingDetail;
  onStale: () => void;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancel = useCancelBooking(String(booking.id));
  const pay = usePayBooking(String(booking.id));
  const canCancel =
    booking.status === 'requested' || booking.status === 'accepted';

  const handleError = (error: unknown, fallback: string) => {
    if (errorStatus(error) === 409) {
      toast.info('This booking changed. Showing the latest.');
      onStale();
      return;
    }
    toast.error(errorMessage(error, fallback));
  };

  const startPayment = () =>
    pay.mutate(undefined, {
      onSuccess: (checkout) =>
        window.location.assign(checkout.authorization_url),
      onError: (error) =>
        handleError(error, 'Payment could not start. Try again.'),
    });

  const confirmCancel = (reason: string) =>
    cancel.mutate(
      { reason: reason || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false);
          toast.success('Booking cancelled.');
        },
        onError: (error) => {
          setCancelOpen(false);
          handleError(error, 'The booking was not cancelled. Try again.');
        },
      }
    );

  return (
    <>
      <PageHeader
        title={booking.listing.title}
        back={back}
        description={
          <>
            with{' '}
            <Link
              href={ROUTES.providerView(booking.provider.slug)}
              className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
            >
              {booking.provider.display_name}
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <div aria-live="polite" className="flex flex-col gap-2">
            <AppStatus status={booking.status} />
            <p className="b1-r max-w-[65ch] text-text">
              {STATUS_HINT[booking.status](booking)}
            </p>
          </div>

          {booking.status === 'accepted' ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-stroke-light pt-5">
              <p className="h5-m text-text tabular-nums">
                {formatMoney(booking.price_amount, booking.currency)}
              </p>
              <AppPaymentNotice />
              <div className="flex flex-wrap gap-2">
                <AppButton loading={pay.isPending} onClick={startPayment}>
                  Pay {formatMoney(booking.price_amount, booking.currency)}
                </AppButton>
                <AppButton variant="text" onClick={() => setCancelOpen(true)}>
                  Cancel Booking
                </AppButton>
              </div>
            </div>
          ) : booking.status === 'requested' ? (
            <div className="mt-5 border-t border-stroke-light pt-5">
              <AppButton variant="outlined" onClick={() => setCancelOpen(true)}>
                Cancel Request
              </AppButton>
            </div>
          ) : null}
        </Card>

        {booking.status === 'completed' ? (
          <Card title={booking.review ? 'Your review' : 'Leave a review'}>
            {booking.review ? (
              <div className="flex flex-col gap-2">
                <p className="b1-m text-text tabular-nums">
                  You rated it {booking.review.rating} out of 5
                </p>
                {booking.review.comment ? (
                  <p className="b1-r max-w-[65ch] break-words text-text">
                    {booking.review.comment}
                  </p>
                ) : null}
              </div>
            ) : (
              <ReviewForm
                bookingId={booking.id}
                listingId={booking.listing.id}
              />
            )}
          </Card>
        ) : null}

        <Card title="Details">
          <dl>
            <DetailRow label="When">
              <time dateTime={booking.scheduled_for} className="tabular-nums">
                {formatDateTime(booking.scheduled_for)}
              </time>
            </DetailRow>
            <DetailRow label="Address">{booking.address}</DetailRow>
            {booking.notes ? (
              <DetailRow label="Notes">{booking.notes}</DetailRow>
            ) : null}
            <DetailRow label="Price">
              <span className="tabular-nums">
                {formatMoney(booking.price_amount, booking.currency)}
              </span>
            </DetailRow>
            {booking.payment ? (
              <DetailRow label="Receipt">
                <span translate="no" className="break-all tabular-nums">
                  {booking.payment.reference}
                </span>
              </DetailRow>
            ) : null}
            <DetailRow label="Booking">
              <span className="tabular-nums">#{booking.id}</span>
            </DetailRow>
          </dl>
        </Card>

        <Card title="History">
          <AppBookingTimeline events={booking.events} />
        </Card>
      </div>

      {booking.status === 'accepted' ? (
        <AppReasonDialog
          open={cancelOpen && canCancel}
          title="Cancel this booking?"
          message={`${booking.provider.display_name} already accepted, so tell them why. You have not paid, so nothing is charged.`}
          confirmLabel="Cancel Booking"
          dismissLabel="Keep Booking"
          required
          loading={cancel.isPending}
          onConfirm={confirmCancel}
          onClose={() => setCancelOpen(false)}
        />
      ) : (
        <AppConfirmDialog
          open={cancelOpen && canCancel}
          title="Cancel this request?"
          message={`${booking.provider.display_name} will see that you withdrew it.`}
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          loading={cancel.isPending}
          onConfirm={() => confirmCancel('')}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </>
  );
}
