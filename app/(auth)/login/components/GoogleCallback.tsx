'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getApplicationConfig, storage } from '@msflib/core';
import { authQueryKeys } from '@msflib/react-auth';
import GoogleAuthHandler from '@/dynamics/GoogleAuthHandler';
import { GOOGLE_NEXT_KEY, GOOGLE_REDIRECT_URI } from '@/constant/app.constant';
import { ROUTES } from '@/constant/routes.constant';
import { useDashboardDestination } from '@/hooks/provider.hooks';

function takeNext() {
  const next = sessionStorage.getItem(GOOGLE_NEXT_KEY);
  sessionStorage.removeItem(GOOGLE_NEXT_KEY);
  return next;
}

// Finishes Google sign-in on `/login?code=…` (ADR 0029). MSFLib's react-auth has no
// setter for an external token, so this does what its `login` mutation does on success.
export default function GoogleCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dashboardDestination = useDashboardDestination();
  const googleError = useSearchParams().get('error');

  // The handler exchanges the one-time code from an unguarded effect, which Strict Mode
  // runs twice in development: the losing exchange fails, so a success must win.
  const signedIn = useRef(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(errorTimer.current), []);

  useEffect(() => {
    if (!googleError) return;
    sessionStorage.removeItem(GOOGLE_NEXT_KEY);
    toast.info('Google sign-in was cancelled. Try again or use your email.', {
      toastId: 'google-cancelled',
    });
    router.replace(ROUTES.login);
  }, [googleError, router]);

  return (
    <GoogleAuthHandler
      apiBaseUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
      redirectUrl={GOOGLE_REDIRECT_URI || undefined}
      onSuccess={async (data: { access_token: string }) => {
        if (signedIn.current) return;
        signedIn.current = true;
        clearTimeout(errorTimer.current);
        storage.setItem(
          getApplicationConfig().accessTokenKey,
          data.access_token
        );
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
        toast.success('Signed in with Google.', {
          toastId: 'google-signed-in',
        });
        router.replace(await dashboardDestination(takeNext()));
      }}
      onError={() => {
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => {
          if (signedIn.current) return;
          sessionStorage.removeItem(GOOGLE_NEXT_KEY);
          toast.error('Google sign-in failed. Try again or use your email.', {
            toastId: 'google-failed',
          });
          router.replace(ROUTES.login);
        }, 1500);
      }}
    />
  );
}
