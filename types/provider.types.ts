import { BookingStatus } from './booking.types';
import { ListingCard, ProviderPublic } from './listing.types';
import { ReviewPublic } from './review.types';

/** `url` is `/uploads/...` on the API origin for local storage; resolve it with `mediaUrl`. */
export type ProviderPhoto = {
  id: number;
  url: string;
  caption: string;
};

type ProviderPhotos = {
  photo_url: string | null;
  photos: ProviderPhoto[];
};

export type ProviderDetail = ProviderPublic &
  ProviderPhotos & {
    bio: string;
    listings: ListingCard[];
    recent_reviews: ReviewPublic[];
  };

/** `day` is `YYYY-MM-DD` in Africa/Lagos (ADR 0028). */
export type BlockedDay = {
  day: string;
  note: string;
};

export type BlockedDayWrite = {
  day: string;
  note?: string;
};

export type ProviderStats = {
  published_listing_count: number;
  open_booking_count: number;
  completed_booking_count: number;
};

export type ProviderMine = ProviderPublic &
  ProviderPhotos & {
    id: number;
    workspace_slug: string;
    bio: string;
    phone: string;
    stats: ProviderStats;
  };

export type ProviderWrite = {
  display_name: string;
  bio: string;
  service_area: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type EarningsEntry = {
  booking_id: number;
  listing_title: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: Extract<BookingStatus, 'paid' | 'completed'>;
  updated_at: string;
};

export type Earnings = {
  completed_count: number;
  total_amount: number;
  pending_amount: number;
  currency: string;
  recent: EarningsEntry[];
};
