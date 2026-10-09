'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import FormBuilder from '@/dynamics/FormBuilder';
import { ROUTES } from '@/constant/routes.constant';
import {
  useBlockDay,
  useMyBlockedDays,
  useUnblockDay,
} from '@/hooks/provider.hooks';
import { formatDateKey } from '@/utils/date.utils';
import { errorMessage } from '@/utils/error.utils';
import { Card, ErrorState, PageHeader } from '../../../components/Page';
import {
  BlockDayFormData,
  blockDayElements,
} from '../../data/form/availability.form';
import { BlockDayLayout } from '../../data/form/availability.layout';

const EMPTY: BlockDayFormData = { day: '', note: '' };

export default function ProviderAvailability() {
  const { data, isPending, isError, refetch } = useMyBlockedDays();
  const block = useBlockDay();
  const unblock = useUnblockDay();
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState<BlockDayFormData>(EMPTY);
  const days = data ?? [];

  return (
    <>
      <PageHeader
        title="Availability"
        description="Block the days you can’t work. Customers can’t request those days, and the booking form lists them."
      />
      <div className="flex flex-col gap-6">
        <Card title="Block a Day">
          <FormBuilder
            key={formKey}
            elements={blockDayElements(days.map((d) => d.day))}
            layout={BlockDayLayout}
            formData={formData}
            setFormData={setFormData}
            loadingState={block.isPending}
            onSubmit={(values: BlockDayFormData) =>
              block.mutate(
                { day: values.day, note: (values.note ?? '').trim() },
                {
                  onSuccess: (row) => {
                    toast.success(`${formatDateKey(row.day)} is blocked.`);
                    setFormData(EMPTY);
                    setFormKey((k) => k + 1);
                  },
                  onError: (error) =>
                    toast.error(
                      errorMessage(error, 'The day was not blocked. Try again.')
                    ),
                }
              )
            }
          />
          <p className="b2-r mt-4 max-w-[65ch] text-text-light">
            Bookings you already have on a blocked day stay as they are. Decline
            or cancel them from{' '}
            <Link
              href={ROUTES.provider.bookings}
              className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
            >
              Incoming Bookings
            </Link>{' '}
            if you need to.
          </p>
        </Card>

        <Card title="Blocked Days">
          {isPending ? (
            <AppSkeleton.Text lines={4} />
          ) : isError ? (
            <ErrorState
              message="Your blocked days did not load. Check your connection and try again."
              onRetry={() => refetch()}
            />
          ) : days.length === 0 ? (
            <p className="b2-r text-text-light">
              No blocked days. Customers can request any upcoming day.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-ink/10">
              {days.map((d) => (
                <li
                  key={d.day}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="b1-m text-text tabular-nums">
                      <time dateTime={d.day}>{formatDateKey(d.day)}</time>
                    </p>
                    {d.note ? (
                      <p className="b2-r break-words text-text-light">
                        {d.note}
                      </p>
                    ) : null}
                  </div>
                  <AppButton
                    variant="text"
                    loading={unblock.isPending && unblock.variables === d.day}
                    onClick={() =>
                      unblock.mutate(d.day, {
                        onSuccess: () =>
                          toast.success(
                            `${formatDateKey(d.day)} is open for bookings again.`
                          ),
                        onError: (error) =>
                          toast.error(
                            errorMessage(
                              error,
                              'The day was not unblocked. Try again.'
                            )
                          ),
                      })
                    }
                  >
                    Unblock
                    <span className="sr-only"> {formatDateKey(d.day)}</span>
                  </AppButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
