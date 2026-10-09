export const ROUTES = {
  home: '/',
  services: '/services',
  servicesMap: '/services?view=map',
  serviceView: (id: string | number) => `/services/view?id=${id}`,
  providerView: (slug: string) => `/providers/view?slug=${slug}`,
  bookings: {
    list: '/bookings',
    create: (listingId: string | number) =>
      `/bookings/manage?listing_id=${listingId}`,
    view: (id: string | number) => `/bookings/view?id=${id}`,
    paymentCallback: '/bookings/payment',
  },
  provider: {
    onboard: '/provider/onboard',
    dashboard: '/provider',
    listings: '/provider/listings',
    listingManage: (id?: string | number) =>
      id ? `/provider/listings/manage?id=${id}` : '/provider/listings/manage',
    bookings: '/provider/bookings',
    bookingView: (id: string | number) => `/provider/bookings/view?id=${id}`,
    profile: '/provider/profile',
    availability: '/provider/availability',
  },
  login: '/login',
  register: '/register',
  registerProvider: '/register?as=provider',
  forgotPassword: '/forgot-password',
  terms: '/terms',
} as const;
