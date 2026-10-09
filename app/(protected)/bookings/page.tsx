import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import BookingList from './components/BookingList';

export default function BookingsPage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={6} />}>
      <BookingList />
    </Suspense>
  );
}
