import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import BookingView from './components/BookingView';

export default function BookingViewPage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={8} />}>
      <BookingView />
    </Suspense>
  );
}
