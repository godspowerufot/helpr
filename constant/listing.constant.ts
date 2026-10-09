import { ListingSort } from '@/types/listing.types';

export const LISTING_PAGE_SIZE = 20;

export const LISTING_SORTS = [
  'price_asc',
  'price_desc',
  'rating',
  'distance',
] as const satisfies readonly ListingSort[];
