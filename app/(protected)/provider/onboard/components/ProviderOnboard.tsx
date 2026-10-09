'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { storage } from '@msflib/core';
import { ACTIVE_WORKSPACE_KEY } from '@/constant/provider.constant';
import { ROUTES } from '@/constant/routes.constant';
import { useBecomeProvider, useMyProviders } from '@/hooks/provider.hooks';
import { errorMessage } from '@/utils/error.utils';
import { Card, PageHeader } from '../../../components/Page';
import ProviderForm from '../../components/ProviderForm';

export default function ProviderOnboard() {
  const router = useRouter();
  const become = useBecomeProvider();
  const { data: businesses } = useMyProviders();
  const existing = businesses?.[0];

  return (
    <>
      <PageHeader
        title="Become a Provider"
        description="Clean homes, cook, fix, paint or do laundry? Set up your business, list your services and get booked by people nearby."
      />

      {existing ? (
        <p className="b2-r mb-4 text-text-light">
          You already run{' '}
          <Link
            href={ROUTES.provider.dashboard}
            className="text-text underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
          >
            {existing.display_name}
          </Link>
          . Fill this in only to add another business.
        </p>
      ) : null}

      <Card title="Your business">
        <ProviderForm
          submitLabel="Create Business"
          loading={become.isPending}
          onSubmit={(body) =>
            become.mutate(body, {
              onSuccess: (created) => {
                storage.setItem(ACTIVE_WORKSPACE_KEY, created.workspace_slug);
                toast.success(
                  'Your business is ready. Add your first service.'
                );
                router.push(ROUTES.provider.listingManage());
              },
              onError: (error) =>
                toast.error(
                  errorMessage(
                    error,
                    'Your business was not created. Try again.'
                  )
                ),
            })
          }
        />
      </Card>
    </>
  );
}
