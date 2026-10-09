import { ApiResponseError } from '@msflib/typescript';
import { ROUTES } from '@/constant/routes.constant';
import {
  MOCK_BOOKINGS,
  MOCK_CUSTOMER_NAME,
  MockBooking,
} from '@/data/booking.data';
import { MOCK_CATEGORIES } from '@/data/category.data';
import { MOCK_LISTINGS, MockListing } from '@/data/listing.data';
import { MOCK_MAP_CONFIG } from '@/data/map.data';
import { MOCK_ACCOUNT_ID, MOCK_NOTIFICATIONS } from '@/data/notification.data';
import { MOCK_PAYMENTS } from '@/data/payment.data';
import {
  MOCK_MY_PROVIDER_SLUG,
  MOCK_PROVIDERS,
  MockProvider,
} from '@/data/provider.data';
import { MOCK_REVIEWS } from '@/data/review.data';
import {
  BookingActorRole,
  BookingCreate,
  BookingDetail,
  BookingQuery,
  BookingReason,
  BookingStatus,
  BookingSummary,
  ProviderBookingAction,
} from '@/types/booking.types';
import {
  CategoryPublic,
  ListingCard,
  ListingDetail,
  ListingList,
  ListingQuery,
  ListingWrite,
  ProviderListing,
  ProviderPublic,
} from '@/types/listing.types';
import {
  AccountNotification,
  NotificationQuery,
} from '@/types/notification.types';
import { LatLng, MapConfig, NearbyQuery, ProviderPin } from '@/types/map.types';
import { notificationMessage } from '@/utils/notification.utils';
import { PaymentCheckout, PaymentRead } from '@/types/payment.types';
import {
  BlockedDay,
  BlockedDayWrite,
  Earnings,
  EarningsEntry,
  ProviderDetail,
  ProviderMine,
  ProviderPhoto,
  ProviderWrite,
} from '@/types/provider.types';
import { ReviewCreate, ReviewList, ReviewPublic } from '@/types/review.types';
import { toDateKey, toRegionDateKey } from '@/utils/date.utils';
import { distanceKm, isInBounds } from '@/utils/geo.utils';

const LATENCY_MS = 300;

const db = {
  listings: structuredClone(MOCK_LISTINGS),
  bookings: structuredClone(MOCK_BOOKINGS),
  payments: structuredClone(MOCK_PAYMENTS),
  reviews: structuredClone(MOCK_REVIEWS),
  providers: structuredClone(MOCK_PROVIDERS),
  notifications: structuredClone(MOCK_NOTIFICATIONS),
  myProviderSlugs: [MOCK_MY_PROVIDER_SLUG],
  profilePhotos: {} as Record<string, string>,
  workPhotos: {} as Record<string, ProviderPhoto[]>,
  blockedDays: {} as Record<string, BlockedDay[]>,
  nextId: 1000,
};

const MAX_WORK_PHOTOS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const photoError = (file: File) => {
  if (file.size > MAX_PHOTO_BYTES)
    return fail(413, 'Uploaded file exceeds maximum allowed size.');
  if (!PHOTO_TYPES.includes(file.type))
    return fail(415, 'Upload a JPEG, PNG or WebP image.');
  return null;
};

const providerPhotos = (slug: string) => ({
  photo_url: db.profilePhotos[slug] ?? null,
  photos: db.workPhotos[slug] ?? [],
});

const upcomingBlockedDays = (slug: string) => {
  const today = toDateKey(new Date());
  return (db.blockedDays[slug] ?? [])
    .filter((d) => d.day >= today)
    .sort((a, b) => a.day.localeCompare(b.day));
};

const nextId = () => ++db.nextId;
const now = () => new Date().toISOString();

const ok = <T>(value: T) =>
  new Promise<T>((resolve) =>
    setTimeout(() => resolve(structuredClone(value)), LATENCY_MS)
  );

const fail = (status: number, detail: string) =>
  new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new ApiResponseError(detail, {
            status,
            statusText: detail,
            raw: { detail },
          })
        ),
      LATENCY_MS
    )
  );

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const reference = (bookingId: number) =>
  `HLP-${bookingId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function rating(reviews: ReviewPublic[]) {
  if (reviews.length === 0) return { rating_avg: 0, rating_count: 0 };
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return {
    rating_avg: Math.round((sum / reviews.length) * 10) / 10,
    rating_count: reviews.length,
  };
}

const findListing = (id: number) => db.listings.find((l) => l.id === id);
const findProvider = (slug: string) =>
  db.providers.find((p) => p.slug === slug);
const listingReviews = (listingId: number) =>
  db.reviews.filter((r) => r.listing_id === listingId);
const providerReviews = (slug: string) => {
  const ids = new Set(
    db.listings.filter((l) => l.provider_slug === slug).map((l) => l.id)
  );
  return db.reviews.filter((r) => ids.has(r.listing_id));
};

function providerPublic(provider: MockProvider): ProviderPublic {
  return {
    slug: provider.slug,
    display_name: provider.display_name,
    service_area: provider.service_area,
    ...rating(providerReviews(provider.slug)),
    latitude: provider.latitude,
    longitude: provider.longitude,
  };
}

const OUTSIDE_REGION = `Helpr is only available in ${MOCK_MAP_CONFIG.region_name} for now.`;

const inRegion = (point: LatLng) => isInBounds(point, MOCK_MAP_CONFIG.bounds);

const clampRadius = (radius?: number) =>
  Math.min(
    radius ?? MOCK_MAP_CONFIG.default_radius_km,
    MOCK_MAP_CONFIG.max_radius_km
  );

function providerDistance(provider: MockProvider, point?: LatLng) {
  if (!point || provider.latitude == null || provider.longitude == null)
    return null;
  const km = distanceKm(point, {
    lat: provider.latitude,
    lng: provider.longitude,
  });
  return Math.round(km * 100) / 100;
}

function listingCard(listing: MockListing, point?: LatLng): ListingCard {
  const provider = findProvider(listing.provider_slug) as MockProvider;
  const category = MOCK_CATEGORIES.find(
    (c) => c.slug === listing.category_slug
  );
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    pricing_type: listing.pricing_type,
    price_amount: listing.price_amount,
    currency: listing.currency,
    duration_minutes: listing.duration_minutes,
    service_area: listing.service_area,
    ...rating(listingReviews(listing.id)),
    category: {
      slug: listing.category_slug,
      name: category?.name ?? listing.category_slug,
    },
    provider: { slug: provider.slug, display_name: provider.display_name },
    latitude: provider.latitude,
    longitude: provider.longitude,
    distance_km: providerDistance(provider, point),
  };
}

const listingDetail = (listing: MockListing): ListingDetail => ({
  ...listingCard(listing),
  provider: providerPublic(findProvider(listing.provider_slug) as MockProvider),
});

const providerListing = (listing: MockListing): ProviderListing => ({
  ...listingCard(listing),
  status: listing.status,
  created_at: listing.created_at,
  updated_at: listing.updated_at,
});

function bookingSummary(booking: MockBooking): BookingSummary {
  const listing = findListing(booking.listing_id) as MockListing;
  const provider = findProvider(listing.provider_slug) as MockProvider;
  return {
    id: booking.id,
    status: booking.status,
    scheduled_for: booking.scheduled_for,
    address: booking.address,
    latitude: booking.latitude,
    longitude: booking.longitude,
    price_amount: booking.price_amount,
    currency: booking.currency,
    listing: { id: listing.id, title: listing.title },
    provider: { slug: provider.slug, display_name: provider.display_name },
    customer_name: booking.customer_name,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  };
}

function bookingDetail(booking: MockBooking): BookingDetail {
  const payment = db.payments.find((p) => p.id === booking.payment_id);
  const listing = findListing(booking.listing_id) as MockListing;
  const provider = findProvider(listing.provider_slug) as MockProvider;
  return {
    ...bookingSummary(booking),
    notes: booking.notes,
    distance_km:
      booking.latitude == null || booking.longitude == null
        ? null
        : providerDistance(provider, {
            lat: booking.latitude,
            lng: booking.longitude,
          }),
    events: booking.events,
    payment: payment
      ? { id: payment.id, reference: payment.reference, status: payment.status }
      : null,
    review: db.reviews.find((r) => r.booking_id === booking.id) ?? null,
  };
}

function notify(title: string, message: string) {
  const at = now();
  const id = nextId();
  db.notifications.push({
    id,
    receiver_id: MOCK_ACCOUNT_ID,
    notification_id: id,
    is_read: false,
    notification: {
      id,
      title,
      message,
      channels: ['inapp'],
      sender_id: null,
      notification_type: 'system',
      scope: 'account',
      created_at: at,
      updated_at: at,
    },
    created_at: at,
    updated_at: at,
  });
}

// ADR 0021 activity table; "me" is notified only for the side of the booking I am on.
const NOTIFY_TITLES: Partial<Record<BookingStatus, string>> = {
  requested: 'New booking request',
  accepted: 'Booking accepted. Pay to confirm',
  declined: 'Booking declined',
  paid: 'Booking paid',
  completed: 'Job completed. Leave a review',
  cancelled: 'Booking cancelled',
};

function notifyTransition(
  booking: MockBooking,
  to: BookingStatus,
  actor: BookingActorRole
) {
  const listing = findListing(booking.listing_id) as MockListing;
  const toProvider =
    to === 'requested' ||
    to === 'paid' ||
    (to === 'cancelled' && actor === 'customer');
  const isMine = toProvider
    ? db.myProviderSlugs.includes(listing.provider_slug)
    : booking.customer_name === MOCK_CUSTOMER_NAME;
  const title = NOTIFY_TITLES[to];
  if (isMine && title) {
    const href = toProvider
      ? `/provider/bookings/view?id=${booking.id}&workspace=${listing.provider_slug}`
      : `/bookings/view?id=${booking.id}`;
    notify(title, notificationMessage(`“${listing.title}” is now ${to}.`, href));
  }
}

function transition(
  booking: MockBooking,
  to: BookingStatus,
  actor: BookingActorRole,
  reason: string | null = null
) {
  notifyTransition(booking, to, actor);
  const at = now();
  booking.events.push({
    id: nextId(),
    from_status: booking.status,
    to_status: to,
    actor_role: actor,
    reason,
    created_at: at,
  });
  booking.status = to;
  booking.updated_at = at;
}

const customerBooking = (id: number) =>
  db.bookings.find(
    (b) => b.id === id && b.customer_name === MOCK_CUSTOMER_NAME
  );

const sortNewest = <T extends { created_at: string }>(items: T[]) =>
  [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));

const activeProvider = () =>
  db.myProviderSlugs.length ? findProvider(db.myProviderSlugs[0]) : undefined;

const providerBooking = (provider: MockProvider, id: number) =>
  db.bookings.find(
    (b) =>
      b.id === id && findListing(b.listing_id)?.provider_slug === provider.slug
  );

function providerMine(provider: MockProvider): ProviderMine {
  const listings = db.listings.filter((l) => l.provider_slug === provider.slug);
  const bookings = db.bookings.filter((b) =>
    listings.some((l) => l.id === b.listing_id)
  );
  return {
    ...providerPublic(provider),
    id: provider.id,
    workspace_slug: provider.workspace_slug,
    bio: provider.bio,
    phone: provider.phone,
    ...providerPhotos(provider.slug),
    stats: {
      published_listing_count: listings.filter((l) => l.status === 'published')
        .length,
      open_booking_count: bookings.filter((b) =>
        ['requested', 'accepted', 'paid'].includes(b.status)
      ).length,
      completed_booking_count: bookings.filter((b) => b.status === 'completed')
        .length,
    },
  };
}

const NO_PROVIDER = 'You do not manage a provider business.';

export const mockApi = {
  categories: {
    list: () => ok<CategoryPublic[]>(MOCK_CATEGORIES),
  },

  listings: {
    list: (query: ListingQuery) => {
      const q = query.q?.toLowerCase();
      const area = query.area?.toLowerCase();
      const point =
        query.lat != null && query.lng != null
          ? { lat: query.lat, lng: query.lng }
          : undefined;
      if (point && !inRegion(point)) return fail(422, OUTSIDE_REGION);
      if (query.sort === 'distance' && !point)
        return fail(422, 'Sorting by distance needs lat and lng.');
      const radius = clampRadius(query.radius_km);
      let cards = db.listings
        .filter(
          (l) =>
            l.status === 'published' &&
            (!query.category || l.category_slug === query.category) &&
            (!q || `${l.title} ${l.description}`.toLowerCase().includes(q)) &&
            (!area || l.service_area.toLowerCase().includes(area))
        )
        .map((l) => listingCard(l, point));
      if (point) {
        cards = cards.filter(
          (c) => c.distance_km != null && c.distance_km <= radius
        );
        if (!query.sort || query.sort === 'distance')
          cards.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
      }
      if (query.sort === 'price_asc')
        cards.sort((a, b) => a.price_amount - b.price_amount);
      if (query.sort === 'price_desc')
        cards.sort((a, b) => b.price_amount - a.price_amount);
      if (query.sort === 'rating')
        cards.sort((a, b) => b.rating_avg - a.rating_avg);
      return ok<ListingList>({
        items: cards.slice(query.offset, query.offset + query.limit),
        total: cards.length,
      });
    },
    get: (id: number) => {
      const listing = findListing(id);
      if (!listing || listing.status !== 'published')
        return fail(404, 'Listing not found.');
      return ok(listingDetail(listing));
    },
    reviews: (id: number, limit: number, offset: number) => {
      const reviews = sortNewest(listingReviews(id));
      return ok<ReviewList>({
        items: reviews.slice(offset, offset + limit),
        total: reviews.length,
      });
    },
  },

  providers: {
    get: (slug: string) => {
      const provider = findProvider(slug);
      if (!provider) return fail(404, 'Provider not found.');
      const detail: ProviderDetail = {
        ...providerPublic(provider),
        ...providerPhotos(slug),
        bio: provider.bio,
        listings: db.listings
          .filter((l) => l.provider_slug === slug && l.status === 'published')
          .map((l) => listingCard(l)),
        recent_reviews: sortNewest(providerReviews(slug)).slice(0, 5),
      };
      return ok(detail);
    },
    blockedDays: (slug: string) =>
      findProvider(slug)
        ? ok(upcomingBlockedDays(slug).map((d) => d.day))
        : fail(404, 'Provider not found.'),
    create: (body: ProviderWrite) => {
      const slug = slugify(body.display_name);
      if (!slug) return fail(422, 'Display name is required.');
      if (findProvider(slug))
        return fail(409, 'That business name is already taken.');
      const point =
        body.latitude != null && body.longitude != null
          ? { lat: body.latitude, lng: body.longitude }
          : undefined;
      if (point && !inRegion(point)) return fail(422, OUTSIDE_REGION);
      const provider: MockProvider = {
        id: nextId(),
        slug,
        workspace_slug: slug,
        display_name: body.display_name,
        bio: body.bio,
        service_area: body.service_area,
        phone: body.phone,
        latitude: point?.lat ?? null,
        longitude: point?.lng ?? null,
      };
      db.providers.push(provider);
      db.myProviderSlugs.unshift(slug);
      return ok(providerMine(provider));
    },
    mine: () =>
      ok<ProviderMine[]>(
        db.myProviderSlugs
          .map(findProvider)
          .filter((p): p is MockProvider => Boolean(p))
          .map(providerMine)
      ),
  },

  bookings: {
    create: (body: BookingCreate) => {
      const listing = findListing(body.listing_id);
      if (!listing || listing.status !== 'published')
        return fail(404, 'Listing not found.');
      if (db.myProviderSlugs.includes(listing.provider_slug)) {
        return fail(403, 'You cannot book your own listing.');
      }
      if (!body.address.trim()) return fail(422, 'Address is required.');
      if (
        body.latitude != null &&
        body.longitude != null &&
        !inRegion({ lat: body.latitude, lng: body.longitude })
      ) {
        return fail(422, OUTSIDE_REGION);
      }
      const day = toRegionDateKey(body.scheduled_for);
      if (
        upcomingBlockedDays(listing.provider_slug).some((d) => d.day === day)
      ) {
        return fail(
          409,
          'The provider is not available on that day. Pick another date.'
        );
      }
      const at = now();
      const booking: MockBooking = {
        id: nextId(),
        listing_id: listing.id,
        customer_name: MOCK_CUSTOMER_NAME,
        status: 'requested',
        scheduled_for: body.scheduled_for,
        address: body.address,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        notes: body.notes,
        price_amount: listing.price_amount,
        currency: listing.currency,
        payment_id: null,
        events: [
          {
            id: nextId(),
            from_status: null,
            to_status: 'requested',
            actor_role: 'customer',
            reason: null,
            created_at: at,
          },
        ],
        created_at: at,
        updated_at: at,
      };
      db.bookings.push(booking);
      notifyTransition(booking, 'requested', 'customer');
      return ok(bookingDetail(booking));
    },
    mine: (query: BookingQuery) =>
      ok<BookingSummary[]>(
        sortNewest(
          db.bookings.filter(
            (b) =>
              b.customer_name === MOCK_CUSTOMER_NAME &&
              (!query.status || b.status === query.status)
          )
        ).map(bookingSummary)
      ),
    get: (id: number) => {
      const booking = customerBooking(id);
      return booking
        ? ok(bookingDetail(booking))
        : fail(404, 'Booking not found.');
    },
    cancel: (id: number, body: BookingReason) => {
      const booking = customerBooking(id);
      if (!booking) return fail(404, 'Booking not found.');
      if (booking.status === 'accepted' && !body.reason?.trim()) {
        return fail(422, 'A reason is required to cancel an accepted booking.');
      }
      if (booking.status !== 'requested' && booking.status !== 'accepted') {
        return fail(409, `A ${booking.status} booking cannot be cancelled.`);
      }
      transition(booking, 'cancelled', 'customer', body.reason?.trim() || null);
      return ok(bookingDetail(booking));
    },
    pay: (id: number) => {
      const booking = customerBooking(id);
      if (!booking) return fail(404, 'Booking not found.');
      if (booking.status !== 'accepted') {
        return fail(409, 'Only accepted bookings can be paid.');
      }
      const listing = findListing(booking.listing_id) as MockListing;
      const ref = reference(booking.id);
      const callback = `${window.location.origin}${ROUTES.bookings.paymentCallback}`;
      const payment: PaymentRead = {
        id: nextId(),
        account_id: 2,
        email: 'ada@example.com',
        description: `Helpr booking #${booking.id}: ${listing.title}`,
        amount: booking.price_amount / 100,
        callback_url: callback,
        data: { currency: booking.currency, booking_id: booking.id },
        authorization_url: `${callback}?reference=${ref}&trxref=${ref}`,
        access_code: `mock-${booking.id}`,
        reference: ref,
        status: 'unverified',
        gateway: 'paystack',
        created_at: now(),
        updated_at: now(),
      };
      db.payments.push(payment);
      booking.payment_id = payment.id;
      return ok<PaymentCheckout>({
        payment_id: payment.id,
        reference: payment.reference,
        authorization_url: payment.authorization_url,
      });
    },
    review: (id: number, body: ReviewCreate) => {
      const booking = customerBooking(id);
      if (!booking) return fail(404, 'Booking not found.');
      if (booking.status !== 'completed') {
        return fail(409, 'You can review a booking once it is completed.');
      }
      if (db.reviews.some((r) => r.booking_id === id)) {
        return fail(409, 'You have already reviewed this booking.');
      }
      if (
        !Number.isInteger(body.rating) ||
        body.rating < 1 ||
        body.rating > 5
      ) {
        return fail(422, 'Rating must be between 1 and 5.');
      }
      const review: ReviewPublic = {
        id: nextId(),
        booking_id: id,
        listing_id: booking.listing_id,
        rating: body.rating,
        comment: body.comment,
        customer_name: 'Ada L.',
        created_at: now(),
      };
      db.reviews.push(review);
      const listing = findListing(booking.listing_id) as MockListing;
      if (db.myProviderSlugs.includes(listing.provider_slug)) {
        notify(
          'New review',
          `${review.customer_name} rated “${listing.title}” ${review.rating}/5.`
        );
      }
      return ok(review);
    },
  },

  payments: {
    verify: (ref: string) => {
      const payment = db.payments.find((p) => p.reference === ref);
      if (!payment) return fail(404, 'Payment record not found for this user.');
      if (payment.status === 'unverified') {
        payment.status = 'verified';
        payment.updated_at = now();
        payment.data = {
          ...payment.data,
          channel: 'card',
          gateway_response: 'Successful',
        };
      }
      const booking = db.bookings.find((b) => b.payment_id === payment.id);
      if (booking?.status === 'accepted')
        transition(booking, 'paid', 'customer');
      return ok(payment);
    },
    get: (id: number) => {
      const payment = db.payments.find((p) => p.id === id);
      return payment
        ? ok(payment)
        : fail(404, 'Payment record not found for this user.');
    },
  },

  map: {
    config: () => ok<MapConfig>(MOCK_MAP_CONFIG),
    nearby: (query: NearbyQuery) => {
      const point = { lat: query.lat, lng: query.lng };
      if (!inRegion(point)) return fail(422, OUTSIDE_REGION);
      const radius = clampRadius(query.radius_km);
      const pins: ProviderPin[] = [];
      db.providers.forEach((provider) => {
        const distance = providerDistance(provider, point);
        const listings = db.listings.filter(
          (l) =>
            l.provider_slug === provider.slug &&
            l.status === 'published' &&
            (!query.category || l.category_slug === query.category)
        );
        if (distance == null || distance > radius || listings.length === 0)
          return;
        pins.push({
          ...providerPublic(provider),
          distance_km: distance,
          listing_count: listings.length,
          listings: [...listings]
            .sort((x, y) => x.price_amount - y.price_amount)
            .map((l) => ({
              id: l.id,
              title: l.title,
              pricing_type: l.pricing_type,
              price_amount: l.price_amount,
              currency: l.currency,
            })),
          categories: [
            ...new Set(
              listings.map(
                (l) =>
                  MOCK_CATEGORIES.find((c) => c.slug === l.category_slug)
                    ?.name ?? l.category_slug
              )
            ),
          ],
        });
      });
      return ok(pins.sort((a, b) => a.distance_km - b.distance_km));
    },
  },

  notifications: {
    list: (query: NotificationQuery) => {
      const offset = query.offset ?? 0;
      const limit = query.limit ?? 100;
      return ok<AccountNotification[]>(
        db.notifications.slice(offset, offset + limit)
      );
    },
    mark: (id: number, status: boolean) => {
      const item = db.notifications.find((n) => n.id === id);
      if (!item) return fail(404, 'Notification not found.');
      item.is_read = status;
      item.updated_at = now();
      return ok(item);
    },
    markAll: (status: boolean) => {
      db.notifications.forEach((n) => {
        n.is_read = status;
      });
      return ok<AccountNotification[]>(db.notifications);
    },
    remove: (id: number) => {
      const index = db.notifications.findIndex((n) => n.id === id);
      if (index === -1) return fail(404, 'Notification not found.');
      db.notifications.splice(index, 1);
      return ok(null);
    },
  },

  provider: {
    get: () => {
      const provider = activeProvider();
      return provider ? ok(providerMine(provider)) : fail(403, NO_PROVIDER);
    },
    update: (body: Partial<ProviderWrite>) => {
      const provider = activeProvider();
      if (!provider) return fail(403, NO_PROVIDER);
      Object.assign(provider, body);
      return ok(providerMine(provider));
    },
    photos: {
      setProfile: (file: File) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const error = photoError(file);
        if (error) return error;
        db.profilePhotos[provider.slug] = URL.createObjectURL(file);
        return ok(providerMine(provider));
      },
      removeProfile: () => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        if (!db.profilePhotos[provider.slug])
          return fail(404, 'No profile photo to remove.');
        delete db.profilePhotos[provider.slug];
        return ok(providerMine(provider));
      },
      add: (file: File, caption: string) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const error = photoError(file);
        if (error) return error;
        const photos = (db.workPhotos[provider.slug] ??= []);
        if (photos.length >= MAX_WORK_PHOTOS) {
          return fail(
            409,
            `You can show up to ${MAX_WORK_PHOTOS} work photos. Remove one first.`
          );
        }
        const photo: ProviderPhoto = {
          id: nextId(),
          url: URL.createObjectURL(file),
          caption: caption.trim(),
        };
        photos.push(photo);
        return ok(photo);
      },
      remove: (id: number) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const photos = db.workPhotos[provider.slug] ?? [];
        const index = photos.findIndex((p) => p.id === id);
        if (index === -1) return fail(404, 'Photo not found.');
        photos.splice(index, 1);
        return ok(providerMine(provider));
      },
    },
    blockedDays: {
      list: () => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        return ok(upcomingBlockedDays(provider.slug));
      },
      add: (body: BlockedDayWrite) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        if (body.day < toDateKey(new Date()))
          return fail(422, 'Choose today or a later date.');
        const days = (db.blockedDays[provider.slug] ??= []);
        if (days.some((d) => d.day === body.day))
          return fail(409, 'That day is already blocked.');
        const row = { day: body.day, note: body.note?.trim() ?? '' };
        days.push(row);
        return ok(row);
      },
      remove: (day: string) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const days = db.blockedDays[provider.slug] ?? [];
        const index = days.findIndex((d) => d.day === day);
        if (index === -1) return fail(404, 'That day is not blocked.');
        days.splice(index, 1);
        return ok(upcomingBlockedDays(provider.slug));
      },
    },
    listings: {
      list: () => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        return ok<ProviderListing[]>(
          sortNewest(
            db.listings.filter((l) => l.provider_slug === provider.slug)
          ).map(providerListing)
        );
      },
      create: (body: ListingWrite) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        if (body.price_amount <= 0)
          return fail(422, 'Price must be greater than zero.');
        const at = now();
        const listing: MockListing = {
          id: nextId(),
          provider_slug: provider.slug,
          status: 'draft',
          created_at: at,
          updated_at: at,
          ...body,
        };
        db.listings.push(listing);
        return ok(providerListing(listing));
      },
      update: (id: number, body: Partial<ListingWrite>) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const listing = findListing(id);
        if (!listing || listing.provider_slug !== provider.slug) {
          return fail(404, 'Listing not found.');
        }
        Object.assign(listing, body, { updated_at: now() });
        return ok(providerListing(listing));
      },
      setStatus: (id: number, action: 'publish' | 'archive') => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const listing = findListing(id);
        if (!listing || listing.provider_slug !== provider.slug) {
          return fail(404, 'Listing not found.');
        }
        const target = action === 'publish' ? 'published' : 'archived';
        if (listing.status === target)
          return fail(409, `Listing is already ${target}.`);
        listing.status = target;
        listing.updated_at = now();
        return ok(providerListing(listing));
      },
    },
    bookings: {
      list: (query: BookingQuery) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        return ok<BookingSummary[]>(
          sortNewest(
            db.bookings.filter(
              (b) =>
                findListing(b.listing_id)?.provider_slug === provider.slug &&
                (!query.status || b.status === query.status)
            )
          ).map(bookingSummary)
        );
      },
      get: (id: number) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const booking = providerBooking(provider, id);
        return booking
          ? ok(bookingDetail(booking))
          : fail(404, 'Booking not found.');
      },
      act: (
        id: number,
        action: ProviderBookingAction,
        body: BookingReason = {}
      ) => {
        const provider = activeProvider();
        if (!provider) return fail(403, NO_PROVIDER);
        const booking = providerBooking(provider, id);
        if (!booking) return fail(404, 'Booking not found.');
        const rules: Record<
          ProviderBookingAction,
          [BookingStatus, BookingStatus]
        > = {
          accept: ['requested', 'accepted'],
          decline: ['requested', 'declined'],
          cancel: ['accepted', 'cancelled'],
          complete: ['paid', 'completed'],
        };
        const [from, to] = rules[action];
        if (booking.status !== from) {
          return fail(409, `Cannot ${action} a ${booking.status} booking.`);
        }
        if (action === 'cancel' && !body.reason?.trim()) {
          return fail(
            422,
            'A reason is required to cancel an accepted booking.'
          );
        }
        transition(booking, to, 'provider', body.reason?.trim() || null);
        return ok(bookingDetail(booking));
      },
    },
    earnings: () => {
      const provider = activeProvider();
      if (!provider) return fail(403, NO_PROVIDER);
      const entries: EarningsEntry[] = sortNewest(
        db.bookings.filter((b) => {
          const payment = db.payments.find((p) => p.id === b.payment_id);
          return (
            findListing(b.listing_id)?.provider_slug === provider.slug &&
            (b.status === 'paid' || b.status === 'completed') &&
            payment?.status === 'verified'
          );
        })
      ).map((b) => ({
        booking_id: b.id,
        listing_title: (findListing(b.listing_id) as MockListing).title,
        customer_name: b.customer_name,
        amount: b.price_amount,
        currency: b.currency,
        status: b.status as EarningsEntry['status'],
        updated_at: b.updated_at,
      }));
      const sum = (status: EarningsEntry['status']) =>
        entries
          .filter((e) => e.status === status)
          .reduce((t, e) => t + e.amount, 0);
      return ok<Earnings>({
        completed_count: entries.filter((e) => e.status === 'completed').length,
        total_amount: sum('completed'),
        pending_amount: sum('paid'),
        currency: 'NGN',
        recent: entries.slice(0, 10),
      });
    },
  },
};
