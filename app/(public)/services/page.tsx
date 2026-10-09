import { Suspense } from 'react';
import ServicesBrowse from './components/ServicesBrowse';

export default function ServicesPage() {
  return (
    <Suspense
      fallback={<p className="b1-r p-8 pt-32 text-text-light">Loading…</p>}
    >
      <ServicesBrowse />
    </Suspense>
  );
}
