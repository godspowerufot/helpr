'use client';

import { useSearchParams } from 'next/navigation';
import GoogleAuthButton from '@/dynamics/GoogleAuthButton';
import {
  GOOGLE_NEXT_KEY,
  GOOGLE_REDIRECT_PATH,
  GOOGLE_REDIRECT_URI,
} from '@/constant/app.constant';
import { ROUTES } from '@/constant/routes.constant';
import { safeNextPath } from '@/utils/redirect.utils';

export default function GoogleLoginButton() {
  const searchParams = useSearchParams();
  // Empty means "their dashboard", resolved once Google returns (GoogleCallback).
  const destination =
    searchParams.get('as') === 'provider'
      ? ROUTES.provider.onboard
      : safeNextPath(searchParams.get('next'), '');

  return (
    <div className="mt-3">
      <GoogleAuthButton
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
        redirectUrl={
          GOOGLE_REDIRECT_URI ||
          (typeof window === 'undefined'
            ? undefined
            : `${window.location.origin}${GOOGLE_REDIRECT_PATH}`)
        }
        onRedirect={() => sessionStorage.setItem(GOOGLE_NEXT_KEY, destination)}
        label="Continue with Google"
        variant="outlined"
        fullWidth
        sx={{
          minHeight: 44,
          borderRadius: 'var(--button-radius)',
          textTransform: 'none',
          color: 'var(--ink)',
          borderColor: 'var(--stroke)',
          backgroundColor: 'color-mix(in srgb, var(--glass) 50%, transparent)',
          '&:hover': {
            borderColor: 'var(--ink)',
            backgroundColor:
              'color-mix(in srgb, var(--glass) 80%, transparent)',
          },
        }}
      />
    </div>
  );
}
