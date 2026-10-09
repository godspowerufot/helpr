import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import BookingWizard from './components/BookingWizard';

export default function BookingManagePage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={8} />}>
      <BookingWizard />
    </Suspense>
  );
}
