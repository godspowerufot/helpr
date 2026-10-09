import { Suspense } from 'react';
import ListingDetails from './components/ListingDetails';

export default function ServiceViewPage() {
  return (
    <Suspense
      fallback={<p className="b1-r p-8 pt-32 text-text-light">Loading…</p>}
    >
      <ListingDetails />
    </Suspense>
  );
}
