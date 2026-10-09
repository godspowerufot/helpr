import { Suspense } from 'react';
import { AppSkeleton } from '@msflib/react-components';
import PaymentReturn from './components/PaymentReturn';

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<AppSkeleton.Text lines={4} />}>
      <PaymentReturn />
    </Suspense>
  );
}
