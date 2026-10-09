'use client';

import { useAuth } from '@msflib/react-auth';
import { ROUTES } from '@/constant/routes.constant';
import PillLink from '@/components/PillLink';

export default function HeroSecondary() {
  const { status } = useAuth();

  return status === 'authenticated' ? (
    <PillLink
      variant="glass"
      href={ROUTES.servicesMap}
      className="min-h-12 w-full px-6 sm:w-auto"
    >
      Open the Map
    </PillLink>
  ) : (
    <PillLink
      variant="glass"
      href={ROUTES.register}
      className="min-h-12 w-full px-6 sm:w-auto"
    >
      Create Account
    </PillLink>
  );
}
