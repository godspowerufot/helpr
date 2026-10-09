'use client';

import { useSearchParams } from 'next/navigation';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import AppPaymentNotice from '@/components/AppPaymentNotice';
import { ROUTES } from '@/constant/routes.constant';
import { useVerifyPayment } from '@/hooks/booking.hooks';
import { Card, ErrorState, PageHeader } from '../../../components/Page';

export default function PaymentReturn() {
  const params = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const { data, isPending, isError, refetch } = useVerifyPayment(reference);

  const rawBookingId = data?.data?.booking_id;
  const bookingId =
    typeof rawBookingId === 'number' || typeof rawBookingId === 'string'
      ? rawBookingId
      : null;
  const bookingHref = bookingId
    ? ROUTES.bookings.view(bookingId)
    : ROUTES.bookings.list;
  const bookingLabel = bookingId ? 'View Booking' : 'My Bookings';

  if (!reference) {
    return (
      <>
        <PageHeader title="No payment to check" />
        <Card>
          <p className="b1-r mb-4 text-text-light">
            This page opens after Paystack checkout. Start a payment from an
            accepted booking.
          </p>
          <AppButton href={ROUTES.bookings.list}>My Bookings</AppButton>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Payment" />
      <Card>
        <div aria-live="polite" className="flex flex-col gap-4">
          {isPending ? (
            <>
              <p className="b1-r text-text">
                Checking your payment with Paystack…
              </p>
              <AppSkeleton.Text lines={2} />
            </>
          ) : isError ? (
            <ErrorState
              message="We could not confirm this payment yet. If you were charged, it will show on the booking shortly."
              onRetry={() => refetch()}
            />
          ) : data.status === 'verified' || data.status === 'fulfilled' ? (
            <>
              <h2 className="h5-m text-text">Payment received</h2>
              <p className="b1-r max-w-[65ch] text-text-light">
                Your booking is paid and scheduled. The provider has been told.
              </p>
              <p className="b2-r text-text-light">
                Reference{' '}
                <span
                  translate="no"
                  className="break-all text-text tabular-nums"
                >
                  {data.reference}
                </span>
              </p>
              <div>
                <AppButton href={bookingHref}>{bookingLabel}</AppButton>
              </div>
            </>
          ) : data.status === 'failed' ? (
            <>
              <h2 className="h5-m text-text">Payment did not go through</h2>
              <p className="b1-r max-w-[65ch] text-text-light">
                Nothing was charged. Open the booking to try again.
              </p>
              <div>
                <AppButton href={bookingHref}>{bookingLabel}</AppButton>
              </div>
            </>
          ) : (
            <>
              <h2 className="h5-m text-text">Payment still processing</h2>
              <p className="b1-r max-w-[65ch] text-text-light">
                Paystack has not confirmed it yet. Check again in a moment.
              </p>
              <div className="flex flex-wrap gap-2">
                <AppButton onClick={() => refetch()}>Check Again</AppButton>
                <AppButton variant="text" href={bookingHref}>
                  {bookingLabel}
                </AppButton>
              </div>
            </>
          )}
          <AppPaymentNotice />
        </div>
      </Card>
    </>
  );
}
