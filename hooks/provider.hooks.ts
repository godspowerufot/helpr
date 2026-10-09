import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '@/api/provider.api';
import { providerWorkspaceApi } from '@/api/provider-workspace.api';
import { ROUTES } from '@/constant/routes.constant';
import { BlockedDayWrite, ProviderWrite } from '@/types/provider.types';
import { safeNextPath } from '@/utils/redirect.utils';
import { BOOKING_REFRESH_MS } from './booking.hooks';

export const providerKeys = {
  all: ['provider'] as const,
  detail: (slug: string) => [...providerKeys.all, 'detail', slug] as const,
  mine: () => [...providerKeys.all, 'mine'] as const,
  dashboard: ['provider', 'dashboard'] as const,
  profile: () => [...providerKeys.dashboard, 'profile'] as const,
  earnings: () => [...providerKeys.dashboard, 'earnings'] as const,
  myBlockedDays: () => [...providerKeys.dashboard, 'blocked-days'] as const,
  blockedDays: (slug: string) =>
    [...providerKeys.all, 'blocked-days', slug] as const,
};

export const useProviderBlockedDays = (slug?: string | null) =>
  useQuery({
    queryKey: providerKeys.blockedDays(slug ?? ''),
    queryFn: () => providerApi.blockedDays(slug as string),
    enabled: Boolean(slug),
  });

export const useMyBlockedDays = () =>
  useQuery({
    queryKey: providerKeys.myBlockedDays(),
    queryFn: () => providerWorkspaceApi.blockedDays.list(),
  });

export const useBlockDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BlockedDayWrite) =>
      providerWorkspaceApi.blockedDays.add(body),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: providerKeys.all }),
  });
};

export const useUnblockDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => providerWorkspaceApi.blockedDays.remove(day),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: providerKeys.all }),
  });
};

const useInvalidateProvider = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: providerKeys.all });
};

export const useSetProfilePhoto = () => {
  const invalidate = useInvalidateProvider();
  return useMutation({
    mutationFn: (file: File) => providerWorkspaceApi.photos.setProfile(file),
    onSuccess: invalidate,
  });
};

export const useRemoveProfilePhoto = () => {
  const invalidate = useInvalidateProvider();
  return useMutation({
    mutationFn: () => providerWorkspaceApi.photos.removeProfile(),
    onSuccess: invalidate,
  });
};

export const useAddWorkPhoto = () => {
  const invalidate = useInvalidateProvider();
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption: string }) =>
      providerWorkspaceApi.photos.add(file, caption),
    onSuccess: invalidate,
  });
};

export const useRemoveWorkPhoto = () => {
  const invalidate = useInvalidateProvider();
  return useMutation({
    mutationFn: (id: number) => providerWorkspaceApi.photos.remove(id),
    onSuccess: invalidate,
  });
};

export const useProvider = (slug?: string | null) =>
  useQuery({
    queryKey: providerKeys.detail(slug ?? ''),
    queryFn: () => providerApi.get(slug as string),
    enabled: Boolean(slug),
  });

export const useMyProviders = (enabled = true) =>
  useQuery({
    queryKey: providerKeys.mine(),
    queryFn: () => providerApi.mine(),
    enabled,
  });

// Where to land after any sign-in: the page that asked for it, else the provider
// dashboard for business owners and admins, else the customer's bookings.
export const useDashboardDestination = () => {
  const queryClient = useQueryClient();
  return async (next: string | null) => {
    const requested = safeNextPath(next, '');
    if (requested) return requested;
    try {
      const businesses = await queryClient.fetchQuery({
        queryKey: providerKeys.mine(),
        queryFn: () => providerApi.mine(),
        staleTime: 0,
      });
      return businesses.length > 0
        ? ROUTES.provider.dashboard
        : ROUTES.bookings.list;
    } catch {
      return ROUTES.bookings.list;
    }
  };
};

export const useBecomeProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProviderWrite) => providerApi.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: providerKeys.all }),
  });
};

export const useProviderProfile = () =>
  useQuery({
    queryKey: providerKeys.profile(),
    queryFn: () => providerWorkspaceApi.get(),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ProviderWrite>) =>
      providerWorkspaceApi.update(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: providerKeys.all }),
  });
};

export const useEarnings = () =>
  useQuery({
    queryKey: providerKeys.earnings(),
    queryFn: () => providerWorkspaceApi.earnings(),
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
