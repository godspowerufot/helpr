'use client';

import { useState } from 'react';
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
  useProviderBooking,
  useProviderBookingAction,
} from '@/hooks/provider-workspace.hooks';
import { BookingDetail, ProviderBookingAction } from '@/types/booking.types';
import { formatDateTime } from '@/utils/date.utils';
import { errorMessage, errorStatus } from '@/utils/error.utils';
import { formatMoney } from '@/utils/money.utils';
import {
  Card,
  DetailRow,
  ErrorState,
  PageHeader,
} from '../../../../components/Page';

const back = { href: ROUTES.provider.bookings, label: 'Incoming Bookings' };

export default function ProviderBookingView() {
  const id = useSearchParams().get('id');
  const { data, isPending, isError, error, refetch } = useProviderBooking(id);
  const status = errorStatus(error);

  if (!id || !/^\d+$/.test(id) || status === 403 || status === 404) {
    return (
      <>
        <PageHeader title="Booking not found" back={back} />
        <Card>
          <AppEmptyState
            message="You don't have access to this booking, or it does not exist."
            actionHref={ROUTES.provider.bookings}
            actionLabel="Incoming Bookings"
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

const HINT: Record<BookingDetail['status'], string> = {
  requested:
    'Accept if you can do this job at that time. The customer pays after you accept.',
  accepted:
    'You accepted. Waiting for the customer to pay; do not start before it shows as paid.',
  paid: 'Paid. Do the job, then mark it done.',
  completed: 'Job done. The payment is recorded in your earnings.',
  declined: 'You declined this request.',
  cancelled: 'This booking was cancelled.',
};

type Dialog = 'decline' | 'cancel' | 'complete' | null;

function BookingContent({
  booking,
  onStale,
}: {
  booking: BookingDetail;
  onStale: () => void;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const act = useProviderBookingAction(String(booking.id));

  const run = (action: ProviderBookingAction, reason?: string) =>
    act.mutate(
      { action, reason: reason || undefined },
      {
        onSuccess: () => {
          setDialog(null);
          toast.success(
            {
              accept: 'Booking accepted. The customer can now pay.',
              decline: 'Request declined.',
              cancel: 'Booking cancelled.',
              complete: 'Marked as done.',
            }[action]
          );
        },
        onError: (error) => {
          setDialog(null);
          if (errorStatus(error) === 409) {
            toast.info('This booking changed. Showing the latest.');
            onStale();
            return;
          }
          toast.error(errorMessage(error, 'That did not work. Try again.'));
        },
      }
    );

  const pendingAction = act.isPending ? act.variables?.action : undefined;

  return (
    <>
      <PageHeader
        title={booking.listing.title}
        back={back}
        description={`for ${booking.customer_name}`}
      />

      <div className="flex flex-col gap-4">
        <Card>
          <div aria-live="polite" className="flex flex-col gap-2">
            <AppStatus status={booking.status} audience="provider" />
            <p className="b1-r max-w-[65ch] text-text">
              {HINT[booking.status]}
            </p>
          </div>

          {booking.status === 'requested' ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-stroke-light pt-5">
              <AppButton
                loading={pendingAction === 'accept'}
                disabled={act.isPending}
                onClick={() => run('accept')}
              >
                Accept Booking
              </AppButton>
              <AppButton
                variant="outlined"
                disabled={act.isPending}
                onClick={() => setDialog('decline')}
              >
                Decline
              </AppButton>
            </div>
          ) : booking.status === 'accepted' ? (
            <div className="mt-5 border-t border-stroke-light pt-5">
              <AppButton variant="outlined" onClick={() => setDialog('cancel')}>
                Cancel Booking
              </AppButton>
            </div>
          ) : booking.status === 'paid' ? (
            <div className="mt-5 border-t border-stroke-light pt-5">
              <AppButton onClick={() => setDialog('complete')}>
                Mark Job Done
              </AppButton>
            </div>
          ) : null}
        </Card>

        <Card title="Job">
          <dl>
            <DetailRow label="When">
              <time dateTime={booking.scheduled_for} className="tabular-nums">
                {formatDateTime(booking.scheduled_for)}
              </time>
            </DetailRow>
            <DetailRow label="Customer">{booking.customer_name}</DetailRow>
            <DetailRow label="Address">
              {booking.address}
              {booking.distance_km != null ? (
                <span className="b2-r text-text-light tabular-nums">
                  {' '}
                  · {booking.distance_km.toFixed(1)} km from you
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Notes">
              {booking.notes || <span className="text-text-light">None</span>}
            </DetailRow>
            <DetailRow label="Price">
              <span className="tabular-nums">
                {formatMoney(booking.price_amount, booking.currency)}
              </span>
            </DetailRow>
            {booking.payment ? (
              <DetailRow label="Payment">
                <span translate="no" className="break-all tabular-nums">
                  {booking.payment.reference}
                </span>
              </DetailRow>
            ) : null}
            <DetailRow label="Booking">
              <span className="tabular-nums">#{booking.id}</span>
            </DetailRow>
          </dl>
          {booking.payment ? (
            <div className="mt-4">
              <AppPaymentNotice />
            </div>
          ) : null}
        </Card>

        {booking.review ? (
          <Card title="Customer review">
            <p className="b1-m text-text tabular-nums">
              {booking.review.rating} out of 5
            </p>
            {booking.review.comment ? (
              <p className="b1-r mt-1 max-w-[65ch] break-words text-text">
                {booking.review.comment}
              </p>
            ) : null}
          </Card>
        ) : null}

        <Card title="History">
          <AppBookingTimeline events={booking.events} />
        </Card>
      </div>

      <AppReasonDialog
        open={dialog === 'decline'}
        title="Decline this request?"
        message={`${booking.customer_name} will be told you cannot take it. Nothing has been paid.`}
        confirmLabel="Decline Request"
        loading={pendingAction === 'decline'}
        onConfirm={(reason) => run('decline', reason)}
        onClose={() => setDialog(null)}
      />
      <AppReasonDialog
        open={dialog === 'cancel'}
        title="Cancel this booking?"
        message={`You already accepted, so tell ${booking.customer_name} why.`}
        confirmLabel="Cancel Booking"
        dismissLabel="Keep Booking"
        required
        loading={pendingAction === 'cancel'}
        onConfirm={(reason) => run('cancel', reason)}
        onClose={() => setDialog(null)}
      />
      <AppConfirmDialog
        open={dialog === 'complete'}
        title="Mark this job as done?"
        message={`${booking.customer_name} will be asked to leave a review. This cannot be undone.`}
        confirmLabel="Mark Job Done"
        cancelLabel="Not Yet"
        loading={pendingAction === 'complete'}
        onConfirm={() => run('complete')}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
