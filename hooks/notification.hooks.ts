import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification.api';
import { NotificationQuery } from '@/types/notification.types';
import { BOOKING_REFRESH_MS } from './booking.hooks';

export const NOTIFICATIONS_PAGE_SIZE = 50;

export const notificationKeys = {
  all: ['notification'] as const,
  list: (query: NotificationQuery) =>
    [...notificationKeys.all, 'list', query] as const,
};

const DEFAULT_QUERY: NotificationQuery = {
  offset: 0,
  limit: NOTIFICATIONS_PAGE_SIZE,
};

// Newest first; the unread count reads the same cached query, so the badge and inbox agree.
export const useNotifications = (
  query: NotificationQuery = DEFAULT_QUERY,
  enabled = true
) =>
  useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => notificationApi.list(query),
    select: (items) =>
      [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    enabled,
    refetchInterval: BOOKING_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

export const useUnreadNotificationCount = (enabled = true) => {
  const { data } = useNotifications(DEFAULT_QUERY, enabled);
  return data?.filter((n) => !n.is_read).length ?? 0;
};

const useInvalidatingMutation = <T>(
  mutationFn: (arg: T) => Promise<unknown>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useMarkNotification = () =>
  useInvalidatingMutation(({ id, status }: { id: number; status: boolean }) =>
    notificationApi.mark(id, status)
  );

export const useMarkAllNotifications = () =>
  useInvalidatingMutation((status: boolean) => notificationApi.markAll(status));

export const useDeleteNotification = () =>
  useInvalidatingMutation((id: number) => notificationApi.remove(id));
