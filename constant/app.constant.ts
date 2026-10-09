// Serves every Helpr endpoint from `api/mock.api.ts`. Auth (`/login`, `/open`, `/me`) stays real.
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// Backend routes that do not exist yet. They are served from mocks even when
// USE_MOCK_API is false; remove an area once the backend ships its routes.
const PENDING_BACKEND_AREAS = [] as const;

export type ApiArea =
  | 'bookings'
  | 'provider-workspace'
  | 'provider-onboarding'
  | 'listings'
  | 'categories'
  | 'providers'
  | 'payments'
  | 'notifications'
  | 'map';

export const isMocked = (area: ApiArea) =>
  USE_MOCK_API || (PENDING_BACKEND_AREAS as readonly ApiArea[]).includes(area);

// Where Google sends the user back (ADR 0029); `/login` finishes the sign-in.
export const GOOGLE_REDIRECT_PATH = '/login';
export const GOOGLE_REDIRECT_URI =
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? '';
// sessionStorage key: where to go after the Google round trip.
export const GOOGLE_NEXT_KEY = 'helpr.google-next';
