'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@msflib/react-auth';
import { AppSkeleton } from '@msflib/react-components';
import { ROUTES } from '@/constant/routes.constant';
import { withNext } from '@/utils/redirect.utils';

// Signed-out visitors go to login and come back to the same page (C3).
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(withNext(ROUTES.login, here));
  }, [status, router]);

  // The static prerender has no token, so it must render the same text the client
  // shows while `me` loads; status-dependent copy here causes a hydration mismatch.
  if (status !== 'authenticated') {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <p className="b2-r text-text-light">Checking your account…</p>
        <AppSkeleton.Text lines={4} />
      </div>
    );
  }

  return <>{children}</>;
}
