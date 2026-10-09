import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import ProviderBookings from './components/ProviderBookings';

export default function ProviderBookingsPage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={8} />}>
      <ProviderBookings />
    </Suspense>
  );
}
