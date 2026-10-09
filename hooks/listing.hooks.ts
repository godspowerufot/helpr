import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '@/api/listing.api';
import { LISTING_PAGE_SIZE, LISTING_SORTS } from '@/constant/listing.constant';
import { ROUTES } from '@/constant/routes.constant';
import {
  ListingFilterForm,
  ListingQuery,
  ListingSort,
  ServicesView,
} from '@/types/listing.types';
import { NearParams } from '@/types/map.types';

export const listingKeys = {
  all: ['listing'] as const,
  list: (query: ListingQuery) => [...listingKeys.all, 'list', query] as const,
  detail: (id: string) => [...listingKeys.all, 'detail', id] as const,
  reviews: (id: string, offset: number) =>
    [...listingKeys.detail(id), 'reviews', offset] as const,
};

export const LISTING_REVIEWS_PAGE_SIZE = 10;

export function isListingSort(value: string | null): value is ListingSort {
  return LISTING_SORTS.some((sort) => sort === value);
}

const coordinate = (value: string | null) => {
  const n = value == null || value === '' ? NaN : Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// The customer's chosen point lives in the URL, so it survives filters, paging and reloads.
export function readNear(params: URLSearchParams): NearParams | undefined {
  const lat = coordinate(params.get('lat'));
  const lng = coordinate(params.get('lng'));
  if (lat === undefined || lng === undefined) return undefined;
  return { lat, lng, radius_km: coordinate(params.get('radius')) };
}

export function listingHref(
  form: ListingFilterForm,
  offset = 0,
  near?: NearParams,
  view: ServicesView = 'services'
) {
  const params = new URLSearchParams();
  if (view !== 'services') params.set('view', view);
  const q = form.q.trim();
  const area = form.area.trim();
  if (q) params.set('q', q);
  if (form.category) params.set('category', form.category);
  if (area) params.set('area', area);
  if (form.sort) params.set('sort', form.sort);
  if (near) {
    params.set('lat', near.lat.toFixed(5));
    params.set('lng', near.lng.toFixed(5));
    if (near.radius_km) params.set('radius', String(near.radius_km));
  }
  if (offset > 0) params.set('offset', String(offset));
  const search = params.toString();
  return search ? `${ROUTES.services}?${search}` : ROUTES.services;
}

export function useListingQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sortParam = searchParams.get('sort');
  const offsetParam = Number(searchParams.get('offset') ?? '0');
  const offset =
    Number.isFinite(offsetParam) && offsetParam > 0
      ? Math.floor(offsetParam)
      : 0;

  const form: ListingFilterForm = {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    area: searchParams.get('area') ?? '',
    sort: isListingSort(sortParam) ? sortParam : '',
  };

  const near = readNear(searchParams);
  const view: ServicesView =
    searchParams.get('view') === 'map' ? 'map' : 'services';

  const query: ListingQuery = {
    q: form.q.trim() || undefined,
    category: form.category || undefined,
    area: form.area.trim() || undefined,
    // "Nearest first" needs a point; without one the backend would answer 422.
    sort:
      form.sort === 'distance' && !near ? undefined : form.sort || undefined,
    limit: LISTING_PAGE_SIZE,
    offset,
    lat: near?.lat,
    lng: near?.lng,
    radius_km: near?.radius_km,
  };

  const apply = (next: ListingFilterForm, nextOffset = 0) => {
    router.replace(listingHref(next, nextOffset, near, view), {
      scroll: false,
    });
  };

  const setNear = (next?: NearParams) => {
    router.replace(listingHref(form, 0, next, view), { scroll: false });
  };

  const setView = (next: ServicesView) => {
    router.replace(listingHref(form, offset, near, next), { scroll: false });
  };

  const hasFilters = Boolean(form.q || form.category || form.area || form.sort);

  return {
    form,
    query,
    apply,
    hasFilters,
    offset,
    near,
    setNear,
    view,
    setView,
  };
}

export const useListings = (query: ListingQuery) =>
  useQuery({
    queryKey: listingKeys.list(query),
    queryFn: () => listingApi.list(query),
  });

export const useListing = (id?: string | null) =>
  useQuery({
    queryKey: listingKeys.detail(id ?? ''),
    queryFn: () => listingApi.get(id as string),
    enabled: Boolean(id && /^\d+$/.test(id)),
  });

export const useListingReviews = (id?: string | null, offset = 0) =>
  useQuery({
    queryKey: listingKeys.reviews(id ?? '', offset),
    queryFn: () =>
      listingApi.reviews(id as string, LISTING_REVIEWS_PAGE_SIZE, offset),
    enabled: Boolean(id && /^\d+$/.test(id)),
  });
