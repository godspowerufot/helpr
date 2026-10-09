import { Suspense } from 'react';
import ProviderDetails from './components/ProviderDetails';

export default function ProviderViewPage() {
  return (
    <Suspense
      fallback={<p className="b1-r p-8 pt-32 text-text-light">Loading…</p>}
    >
      <ProviderDetails />
    </Suspense>
  );
}
