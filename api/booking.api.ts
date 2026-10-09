import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import {
  BookingCreate,
  BookingDetail,
  BookingQuery,
  BookingReason,
  BookingSummary,
} from '@/types/booking.types';
import { PaymentCheckout } from '@/types/payment.types';
import { ReviewCreate, ReviewPublic } from '@/types/review.types';
import { mockApi } from './mock.api';

const ENDPOINT = '/bookings';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const bookingApi = {
  create: (body: BookingCreate) =>
    isMocked('bookings')
      ? mockApi.bookings.create(body)
      : client()<BookingDetail>('POST', ENDPOINT, body, {
          isWorkspaceScoped: false,
        }),
  mine: (query: BookingQuery) =>
    isMocked('bookings')
      ? mockApi.bookings.mine(query)
      : client()<BookingSummary[]>('GET', `${ENDPOINT}/mine`, null, {
          isWorkspaceScoped: false,
          query: { status: query.status },
        }),
  get: (id: string) =>
    isMocked('bookings')
      ? mockApi.bookings.get(Number(id))
      : client()<BookingDetail>('GET', `${ENDPOINT}/${id}`, null, {
          isWorkspaceScoped: false,
        }),
  cancel: (id: string, body: BookingReason) =>
    isMocked('bookings')
      ? mockApi.bookings.cancel(Number(id), body)
      : client()<BookingDetail>('POST', `${ENDPOINT}/${id}/cancel`, body, {
          isWorkspaceScoped: false,
        }),
  pay: (id: string) =>
    isMocked('bookings')
      ? mockApi.bookings.pay(Number(id))
      : client()<PaymentCheckout>('POST', `${ENDPOINT}/${id}/pay`, null, {
          isWorkspaceScoped: false,
        }),
  review: (id: string, body: ReviewCreate) =>
    isMocked('bookings')
      ? mockApi.bookings.review(Number(id), body)
      : client()<ReviewPublic>('POST', `${ENDPOINT}/${id}/review`, body, {
          isWorkspaceScoped: false,
        }),
};
