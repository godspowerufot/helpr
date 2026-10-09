import { BookingEvent, BookingStatus } from '@/types/booking.types';

export type MockBooking = {
  id: number;
  listing_id: number;
  customer_name: string;
  status: BookingStatus;
  scheduled_for: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  price_amount: number;
  currency: string;
  payment_id: number | null;
  events: BookingEvent[];
  created_at: string;
  updated_at: string;
};

// Bookings made by the signed-in account in mock mode.
export const MOCK_CUSTOMER_NAME = 'You';

const event = (
  id: number,
  from_status: BookingStatus | null,
  to_status: BookingStatus,
  actor_role: BookingEvent['actor_role'],
  created_at: string,
  reason: string | null = null
): BookingEvent => ({
  id,
  from_status,
  to_status,
  actor_role,
  reason,
  created_at,
});

export const MOCK_BOOKINGS: MockBooking[] = [
  {
    id: 201,
    listing_id: 4,
    customer_name: MOCK_CUSTOMER_NAME,
    status: 'requested',
    scheduled_for: '2026-10-14T09:00:00Z',
    address: '8 Marina Road, Eket',
    latitude: 4.638,
    longitude: 7.929,
    notes: 'Kitchen sink drips constantly. Gate code 2245.',
    price_amount: 1_500_000,
    currency: 'NGN',
    payment_id: null,
    events: [event(1, null, 'requested', 'customer', '2026-10-08T18:12:00Z')],
    created_at: '2026-10-08T18:12:00Z',
    updated_at: '2026-10-08T18:12:00Z',
  },
  {
    id: 202,
    listing_id: 6,
    customer_name: MOCK_CUSTOMER_NAME,
    status: 'accepted',
    scheduled_for: '2026-10-12T10:00:00Z',
    address: '4 Ikot Udota Street, Eket',
    latitude: 4.6281,
    longitude: 7.942,
    notes: 'Inverter and batteries are already on site.',
    price_amount: 4_500_000,
    currency: 'NGN',
    payment_id: null,
    events: [
      event(2, null, 'requested', 'customer', '2026-10-06T08:40:00Z'),
      event(3, 'requested', 'accepted', 'provider', '2026-10-06T11:02:00Z'),
    ],
    created_at: '2026-10-06T08:40:00Z',
    updated_at: '2026-10-06T11:02:00Z',
  },
  {
    id: 203,
    listing_id: 8,
    customer_name: MOCK_CUSTOMER_NAME,
    status: 'paid',
    scheduled_for: '2026-10-10T13:00:00Z',
    address: '27 Atabong Road, Eket',
    latitude: 4.6512,
    longitude: 7.9199,
    notes: '',
    price_amount: 3_000_000,
    currency: 'NGN',
    payment_id: 1,
    events: [
      event(4, null, 'requested', 'customer', '2026-10-01T09:00:00Z'),
      event(5, 'requested', 'accepted', 'provider', '2026-10-01T12:30:00Z'),
      event(6, 'accepted', 'paid', 'customer', '2026-10-01T12:41:00Z'),
    ],
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T12:41:00Z',
  },
  {
    id: 204,
    listing_id: 11,
    customer_name: MOCK_CUSTOMER_NAME,
    status: 'completed',
    scheduled_for: '2026-09-27T15:00:00Z',
    address: '9 Okon Street, Eket',
    latitude: 4.644,
    longitude: 7.9135,
    notes: 'Lesson for SS3 student, focus on algebra.',
    price_amount: 1_000_000,
    currency: 'NGN',
    payment_id: 2,
    events: [
      event(7, null, 'requested', 'customer', '2026-09-24T07:00:00Z'),
      event(8, 'requested', 'accepted', 'provider', '2026-09-24T08:15:00Z'),
      event(9, 'accepted', 'paid', 'customer', '2026-09-24T08:30:00Z'),
      event(10, 'paid', 'completed', 'provider', '2026-09-27T16:10:00Z'),
    ],
    created_at: '2026-09-24T07:00:00Z',
    updated_at: '2026-09-27T16:10:00Z',
  },
  {
    id: 205,
    listing_id: 10,
    customer_name: MOCK_CUSTOMER_NAME,
    status: 'cancelled',
    scheduled_for: '2026-09-30T08:00:00Z',
    address: '15 Idua Road, Eket',
    latitude: 4.6352,
    longitude: 7.915,
    notes: '',
    price_amount: 12_000_000,
    currency: 'NGN',
    payment_id: null,
    events: [
      event(11, null, 'requested', 'customer', '2026-09-20T10:00:00Z'),
      event(
        12,
        'requested',
        'cancelled',
        'customer',
        '2026-09-21T09:00:00Z',
        'Move date changed.'
      ),
    ],
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-21T09:00:00Z',
  },
  {
    id: 301,
    listing_id: 1,
    customer_name: 'Chiamaka E.',
    status: 'requested',
    scheduled_for: '2026-10-15T08:00:00Z',
    address: '14 Grace Bill Road, Eket',
    latitude: 4.6455,
    longitude: 7.9241,
    notes: 'Three bedrooms, two toilets. We have a dog.',
    price_amount: 2_500_000,
    currency: 'NGN',
    payment_id: null,
    events: [event(13, null, 'requested', 'customer', '2026-10-09T07:30:00Z')],
    created_at: '2026-10-09T07:30:00Z',
    updated_at: '2026-10-09T07:30:00Z',
  },
  {
    id: 302,
    listing_id: 2,
    customer_name: 'Bola S.',
    status: 'accepted',
    scheduled_for: '2026-10-13T09:00:00Z',
    address: '21 Afaha Eket Road, Eket',
    latitude: 4.6566,
    longitude: 7.9333,
    notes: '',
    price_amount: 1_200_000,
    currency: 'NGN',
    payment_id: null,
    events: [
      event(14, null, 'requested', 'customer', '2026-10-07T14:00:00Z'),
      event(15, 'requested', 'accepted', 'provider', '2026-10-07T15:20:00Z'),
    ],
    created_at: '2026-10-07T14:00:00Z',
    updated_at: '2026-10-07T15:20:00Z',
  },
  {
    id: 303,
    listing_id: 1,
    customer_name: 'Ifeoluwa A.',
    status: 'paid',
    scheduled_for: '2026-10-11T08:00:00Z',
    address: '3 Etebi Road, Eket',
    latitude: 4.6419,
    longitude: 7.9302,
    notes: 'Please bring a ladder for the high windows.',
    price_amount: 2_500_000,
    currency: 'NGN',
    payment_id: 3,
    events: [
      event(16, null, 'requested', 'customer', '2026-10-04T10:00:00Z'),
      event(17, 'requested', 'accepted', 'provider', '2026-10-04T10:45:00Z'),
      event(18, 'accepted', 'paid', 'customer', '2026-10-04T11:00:00Z'),
    ],
    created_at: '2026-10-04T10:00:00Z',
    updated_at: '2026-10-04T11:00:00Z',
  },
  {
    id: 304,
    listing_id: 1,
    customer_name: 'Chiamaka E.',
    status: 'completed',
    scheduled_for: '2026-09-09T08:00:00Z',
    address: '14 Grace Bill Road, Eket',
    latitude: 4.6455,
    longitude: 7.9241,
    notes: '',
    price_amount: 2_500_000,
    currency: 'NGN',
    payment_id: 4,
    events: [
      event(19, null, 'requested', 'customer', '2026-09-05T09:00:00Z'),
      event(20, 'requested', 'accepted', 'provider', '2026-09-05T09:30:00Z'),
      event(21, 'accepted', 'paid', 'customer', '2026-09-05T09:42:00Z'),
      event(22, 'paid', 'completed', 'provider', '2026-09-09T14:00:00Z'),
    ],
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-09T14:00:00Z',
  },
  {
    id: 305,
    listing_id: 2,
    customer_name: 'Tobi K.',
    status: 'declined',
    scheduled_for: '2026-10-02T09:00:00Z',
    address: '10 Eket-Oron Road, Eket',
    latitude: 4.6305,
    longitude: 7.9398,
    notes: '',
    price_amount: 1_200_000,
    currency: 'NGN',
    payment_id: null,
    events: [
      event(23, null, 'requested', 'customer', '2026-09-29T19:00:00Z'),
      event(
        24,
        'requested',
        'declined',
        'provider',
        '2026-09-30T07:00:00Z',
        'Fully booked that day.'
      ),
    ],
    created_at: '2026-09-29T19:00:00Z',
    updated_at: '2026-09-30T07:00:00Z',
  },
];
