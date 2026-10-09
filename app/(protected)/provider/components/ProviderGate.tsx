'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { setActiveWorkspace, storage } from '@msflib/core';
import { AppSkeleton } from '@msflib/react-components';
import { useActiveWorkspace } from '@msflib/react-shared';
import AppEmptyState from '@/components/AppEmptyState';
import { ACTIVE_WORKSPACE_KEY } from '@/constant/provider.constant';
import { ROUTES } from '@/constant/routes.constant';
import {
  providerBookingKeys,
  providerListingKeys,
} from '@/hooks/provider-workspace.hooks';
import { providerKeys, useMyProviders } from '@/hooks/provider.hooks';
import { Card, ErrorState } from '../../components/Page';

const STORAGE_KEY = ACTIVE_WORKSPACE_KEY;
let lastSlug: string | null = null;

// Provider routes call `/{workspace_slug}/provider/...` (ADR 0005); this sets that slug.
export function ProviderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/$/, '');
  if (pathname === ROUTES.provider.onboard) return <>{children}</>;
  return <ActiveBusiness>{children}</ActiveBusiness>;
}

function ActiveBusiness({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data, isPending, isFetching, isError, refetch } = useMyProviders();
  const active = useActiveWorkspace();
  const [chosen, setChosen] = useState<string | null>(() =>
    storage.getItem(STORAGE_KEY)
  );
  // A notification link names the business (`?workspace=`). Read it before fetching.
  const [readyFor, setReadyFor] = useState<string | null>(null);

  const businesses = data ?? [];
  const fromUrl =
    readyFor === pathname
      ? businesses.find((b) => b.workspace_slug === chosen)?.workspace_slug
      : undefined;
  const slug =
    fromUrl ??
    businesses.find((b) => b.workspace_slug === chosen)?.workspace_slug ??
    businesses[0]?.workspace_slug ??
    null;

  useEffect(() => {
    const workspace = new URLSearchParams(window.location.search).get(
      'workspace'
    );
    if (workspace) setChosen(workspace);
    setReadyFor(pathname);
  }, [pathname]);

  useEffect(() => {
    if (readyFor !== pathname || !slug) return;
    // Provider query keys are not per-business, so drop another business's cache.
    if (lastSlug && lastSlug !== slug) {
      for (const key of [
        providerListingKeys.all,
        providerBookingKeys.all,
        providerKeys.dashboard,
      ]) {
        queryClient.removeQueries({ queryKey: key });
      }
    }
    lastSlug = slug;
    storage.setItem(STORAGE_KEY, slug);
    setActiveWorkspace(slug);
  }, [slug, queryClient, readyFor, pathname]);

  useEffect(() => () => setActiveWorkspace(null), []);

  if (isPending || (isFetching && !data?.length) || readyFor !== pathname) {
    return (
      <Card>
        <AppSkeleton.Text lines={6} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <ErrorState
          message="Your business did not load. Check your connection and try again."
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  if (!slug) {
    return (
      <Card>
        <h1 className="h4-r mb-2 text-text">Offer your services on Helpr</h1>
        <AppEmptyState
          message="Cleaners, chefs, artisans and other home-service pros: set up a business profile to list services and receive bookings."
          actionHref={ROUTES.provider.onboard}
          actionLabel="Become a Provider"
        />
      </Card>
    );
  }

  if (active !== slug) {
    return (
      <Card>
        <AppSkeleton.Text lines={6} />
      </Card>
    );
  }

  return (
    <>
      {businesses.length > 1 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label htmlFor="business" className="b2-m text-text-light">
            Business
          </label>
          <select
            id="business"
            name="business"
            value={slug}
            onChange={(event) => setChosen(event.target.value)}
            className="b2-m min-h-11 rounded-input-radius border border-stroke bg-surface px-3 text-text"
          >
            {businesses.map((b) => (
              <option key={b.workspace_slug} value={b.workspace_slug}>
                {b.display_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {children}
    </>
  );
}
