export type PricingType = 'fixed' | 'hourly';

export type ListingSort = 'price_asc' | 'price_desc' | 'rating' | 'distance';

export type CategoryPublic = {
  id: number;
  slug: string;
  name: string;
};

export type ProviderPublic = {
  slug: string;
  display_name: string;
  service_area: string;
  rating_avg: number;
  rating_count: number;
  latitude: number | null;
  longitude: number | null;
};

export type ListingCard = {
  id: number;
  title: string;
  description: string;
  pricing_type: PricingType;
  price_amount: number;
  currency: string;
  duration_minutes: number | null;
  service_area: string;
  rating_avg: number;
  rating_count: number;
  category: Pick<CategoryPublic, 'slug' | 'name'>;
  provider: Pick<ProviderPublic, 'slug' | 'display_name'>;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
};

export type ListingDetail = Omit<ListingCard, 'provider'> & {
  provider: ProviderPublic;
};

export type ListingStatus = 'draft' | 'published' | 'archived';

export type ProviderListing = ListingCard & {
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

export type ListingWrite = {
  category_slug: string;
  title: string;
  description: string;
  pricing_type: PricingType;
  price_amount: number;
  currency: string;
  duration_minutes: number | null;
  service_area: string;
};

export type ListingList = {
  items: ListingCard[];
  total: number;
};

export type ListingQuery = {
  category?: string;
  q?: string;
  area?: string;
  sort?: ListingSort;
  limit: number;
  offset: number;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

export type ServicesView = 'services' | 'map';

export type ListingFilterForm = {
  q: string;
  category: string;
  area: string;
  sort: '' | ListingSort;
};
