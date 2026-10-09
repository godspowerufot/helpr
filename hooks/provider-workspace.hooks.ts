import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerWorkspaceApi } from '@/api/provider-workspace.api';
import {
  BookingQuery,
  BookingReason,
  ProviderBookingAction,
} from '@/types/booking.types';
import { ListingWrite } from '@/types/listing.types';
import { BOOKING_REFRESH_MS } from './booking.hooks';
import { listingKeys } from './listing.hooks';
import { providerKeys } from './provider.hooks';

export const providerListingKeys = {
  all: ['provider-listing'] as const,
  list: () => [...providerListingKeys.all, 'list'] as const,
};

export const providerBookingKeys = {
  all: ['provider-booking'] as const,
  list: (query: BookingQuery) =>
    [...providerBookingKeys.all, 'list', query] as const,
  detail: (id: string) => [...providerBookingKeys.all, 'detail', id] as const,
};

const isId = (id?: string | null): id is string =>
  Boolean(id && /^\d+$/.test(id));

export const useProviderListings = () =>
  useQuery({
    queryKey: providerListingKeys.list(),
    queryFn: () => providerWorkspaceApi.listings.list(),
  });

const useInvalidateListings = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: providerListingKeys.all }),
      queryClient.invalidateQueries({ queryKey: listingKeys.all }),
      queryClient.invalidateQueries({ queryKey: providerKeys.dashboard }),
    ]);
};

export const useCreateListing = () => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (body: ListingWrite) =>
      providerWorkspaceApi.listings.create(body),
    onSuccess: invalidate,
  });
};

export const useUpdateListing = (id: string) => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (body: Partial<ListingWrite>) =>
      providerWorkspaceApi.listings.update(id, body),
    onSuccess: invalidate,
  });
};

export const useSetListingStatus = () => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'publish' | 'archive';
    }) => providerWorkspaceApi.listings.setStatus(id, action),
    onSettled: invalidate,
  });
};

export const useProviderBookings = (query: BookingQuery = {}) =>
  useQuery({
    queryKey: providerBookingKeys.list(query),
    queryFn: () => providerWorkspaceApi.bookings.list(query),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useProviderBooking = (id?: string | null) =>
  useQuery({
    queryKey: providerBookingKeys.detail(id ?? ''),
    queryFn: () => providerWorkspaceApi.bookings.get(id as string),
    enabled: isId(id),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useProviderBookingAction = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      reason,
    }: { action: ProviderBookingAction } & BookingReason) =>
      providerWorkspaceApi.bookings.act(id, action, { reason }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: providerBookingKeys.all }),
        queryClient.invalidateQueries({ queryKey: providerKeys.dashboard }),
      ]),
  });
};
