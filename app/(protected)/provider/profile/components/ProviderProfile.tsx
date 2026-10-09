'use client';

import Link from 'next/link';
import { toast } from 'react-toastify';
import { AppSkeleton } from '@msflib/react-components';
import { ROUTES } from '@/constant/routes.constant';
import {
  useProviderProfile,
  useUpdateProviderProfile,
} from '@/hooks/provider.hooks';
import { errorMessage } from '@/utils/error.utils';
import { Card, ErrorState, PageHeader } from '../../../components/Page';
import ProviderForm from '../../components/ProviderForm';
import ProviderPhotos from './ProviderPhotos';

export default function ProviderProfile() {
  const { data, isPending, isError, refetch } = useProviderProfile();
  const update = useUpdateProviderProfile();

  return (
    <>
      <PageHeader
        title="Business Profile"
        description={
          data ? (
            <>
              What customers see on{' '}
              <Link
                href={ROUTES.providerView(data.slug)}
                className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
              >
                your public page
              </Link>
              .
            </>
          ) : (
            'What customers see on your public page.'
          )
        }
      />
      <div className="flex flex-col gap-6">
        <Card title="Details">
          {isPending ? (
            <AppSkeleton.Text lines={8} />
          ) : isError ? (
            <ErrorState
              message="Your profile did not load. Check your connection and try again."
              onRetry={() => refetch()}
            />
          ) : (
            <ProviderForm
              key={data.id}
              initial={data}
              submitLabel="Save Changes"
              loading={update.isPending}
              onSubmit={(body) =>
                update.mutate(body, {
                  onSuccess: () => toast.success('Profile saved.'),
                  onError: (error) =>
                    toast.error(
                      errorMessage(
                        error,
                        'Your changes were not saved. Try again.'
                      )
                    ),
                })
              }
            />
          )}
        </Card>
        {data ? <ProviderPhotos provider={data} /> : null}
      </div>
    </>
  );
}
