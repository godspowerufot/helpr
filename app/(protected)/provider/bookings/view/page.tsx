import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import ProviderBookingView from './components/ProviderBookingView';

export default function ProviderBookingViewPage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={8} />}>
      <ProviderBookingView />
    </Suspense>
  );
}
