import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/api/booking.api';
import { paymentApi } from '@/api/payment.api';
import {
  BookingCreate,
  BookingQuery,
  BookingReason,
} from '@/types/booking.types';
import { ReviewCreate } from '@/types/review.types';
import { listingKeys } from './listing.hooks';

export const BOOKING_REFRESH_MS = 20_000;

export const bookingKeys = {
  all: ['booking'] as const,
  mine: (query: BookingQuery) => [...bookingKeys.all, 'mine', query] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
  payment: (reference: string) =>
    [...bookingKeys.all, 'payment', reference] as const,
};

const isId = (id?: string | null): id is string =>
  Boolean(id && /^\d+$/.test(id));

export const useMyBookings = (query: BookingQuery = {}) =>
  useQuery({
    queryKey: bookingKeys.mine(query),
    queryFn: () => bookingApi.mine(query),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useBooking = (id?: string | null) =>
  useQuery({
    queryKey: bookingKeys.detail(id ?? ''),
    queryFn: () => bookingApi.get(id as string),
    enabled: isId(id),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookingCreate) => bookingApi.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
};

export const useCancelBooking = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookingReason) => bookingApi.cancel(id, body),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
};

// Resolves to a Paystack checkout; the component sends the browser to `authorization_url`.
export const usePayBooking = (id: string) =>
  useMutation({
    mutationFn: () => bookingApi.pay(id),
  });

export const useReviewBooking = (id: string, listingId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewCreate) => bookingApi.review(id, body),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
        queryClient.invalidateQueries({
          queryKey: listingKeys.detail(String(listingId)),
        }),
      ]),
  });
};

export const useVerifyPayment = (reference?: string | null) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: bookingKeys.payment(reference ?? ''),
    queryFn: async () => {
      const payment = await paymentApi.verify(reference as string);
      await queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
        predicate: (query) => query.queryKey[1] !== 'payment',
      });
      return payment;
    },
    enabled: Boolean(reference),
    retry: false,
    staleTime: Infinity,
  });
};
