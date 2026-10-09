import { PaymentStatus } from './payment.types';
import { ReviewPublic } from './review.types';

export type BookingStatus =
  'requested' | 'accepted' | 'declined' | 'cancelled' | 'paid' | 'completed';

export type BookingActorRole = 'customer' | 'provider' | 'system';

export type BookingEvent = {
  id: number;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor_role: BookingActorRole;
  reason: string | null;
  created_at: string;
};

export type BookingPaymentSummary = {
  id: number;
  reference: string;
  status: PaymentStatus;
};

export type BookingSummary = {
  id: number;
  status: BookingStatus;
  scheduled_for: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price_amount: number;
  currency: string;
  listing: { id: number; title: string };
  provider: { slug: string; display_name: string };
  customer_name: string;
  created_at: string;
  updated_at: string;
};

export type BookingDetail = BookingSummary & {
  notes: string;
  distance_km: number | null;
  events: BookingEvent[];
  payment: BookingPaymentSummary | null;
  review: ReviewPublic | null;
};

export type BookingCreate = {
  listing_id: number;
  scheduled_for: string;
  address: string;
  notes: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type BookingReason = {
  reason?: string;
};

export type BookingQuery = {
  status?: BookingStatus;
};

export type ProviderBookingAction =
  'accept' | 'decline' | 'cancel' | 'complete';
