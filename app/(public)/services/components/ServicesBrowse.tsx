'use client';

import { useState } from 'react';
import FormBuilder from '@/dynamics/FormBuilder';
import { useCategories } from '@/hooks/category.hooks';
import { useListingQuery } from '@/hooks/listing.hooks';
import { ListingFilterForm } from '@/types/listing.types';
import { listingFilterElements } from '../data/form/listing-filter.form';
import { ListingFilterLayout } from '../data/form/listing-filter.layout';
import ServicesFrame from './ServicesFrame';
import ServicesSplit from './ServicesSplit';

function FilterForm({
  initial,
  onApply,
}: {
  initial: ListingFilterForm;
  onApply: (next: ListingFilterForm) => void;
}) {
  const [formData, setFormData] = useState<ListingFilterForm>(initial);
  const { data: categories = [] } = useCategories();

  return (
    <FormBuilder
      elements={listingFilterElements(categories)}
      layout={ListingFilterLayout}
      formData={formData}
      setFormData={setFormData}
      onSubmit={(data: ListingFilterForm) => onApply(data)}
    />
  );
}

export default function ServicesBrowse() {
  const { form, apply } = useListingQuery();
  const filterKey = `${form.q}|${form.category}|${form.area}|${form.sort}`;

  return (
    <ServicesFrame>
      <header className="mb-6">
        <h1 className="h1-r text-balance text-text">Services</h1>
        <p className="b1-r mt-2 max-w-[65ch] text-text-light">
          Compare services in your area, see where each provider works, and
          request a booking.
        </p>
      </header>
      <FilterForm
        key={filterKey}
        initial={form}
        onApply={(next) => apply(next)}
      />
      <ServicesSplit />
    </ServicesFrame>
  );
}
