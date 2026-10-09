'use client';

import Link from 'next/link';
import { LayoutProps } from '@msflib/react-components';
import { useCategories } from '@/hooks/category.hooks';
import { listingHref, useListingQuery } from '@/hooks/listing.hooks';
import { GLASS_CARD } from '@/styles/glass.styles';

export function ListingFilterLayout({ FormField }: LayoutProps) {
  const { isError } = useCategories();
  const { hasFilters, view, near } = useListingQuery();
  const clearHref = listingHref(
    { q: '', category: '', area: '', sort: '' },
    0,
    near,
    view
  );

  return (
    <section aria-label="Search and filter" className={`${GLASS_CARD} p-4`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_8rem] xl:items-end">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <FormField elementName="q" />
        </div>
        <div className="min-w-0">
          <FormField elementName="category" />
        </div>
        <div className="min-w-0">
          <FormField elementName="area" />
        </div>
        <div className="min-w-0">
          <FormField elementName="sort" />
        </div>
        <div className="min-w-0 self-end">
          <FormField elementName="submit" />
        </div>
      </div>
      {isError || hasFilters ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {isError ? (
            <p className="b2-r text-error">
              Categories could not be loaded. You can still search by name and
              area.
            </p>
          ) : null}
          {hasFilters ? (
            <Link
              href={clearHref}
              className="b2-m ml-auto inline-flex min-h-11 items-center text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              Clear Filters
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
