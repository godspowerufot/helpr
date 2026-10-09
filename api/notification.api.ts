import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import {
  AccountNotification,
  NotificationQuery,
} from '@/types/notification.types';
import { mockApi } from './mock.api';

// msflib-notifications account router (ADR 0021); every route returns only the caller's rows.
const ENDPOINT = '/notifications';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const notificationApi = {
  list: (query: NotificationQuery) =>
    isMocked('notifications')
      ? mockApi.notifications.list(query)
      : client()<AccountNotification[]>('GET', `${ENDPOINT}/`, null, {
          isWorkspaceScoped: false,
          query: { offset: query.offset, limit: query.limit },
        }),
  mark: (id: number, status: boolean) =>
    isMocked('notifications')
      ? mockApi.notifications.mark(id, status)
      : client()<AccountNotification>('PATCH', `${ENDPOINT}/${id}/mark`, null, {
          isWorkspaceScoped: false,
          query: { status },
        }),
  markAll: (status: boolean) =>
    isMocked('notifications')
      ? mockApi.notifications.markAll(status)
      : client()<AccountNotification[]>('PATCH', `${ENDPOINT}/mark-all`, null, {
          isWorkspaceScoped: false,
          query: { status },
        }),
  remove: (id: number) =>
    isMocked('notifications')
      ? mockApi.notifications.remove(id)
      : client()<unknown>('DELETE', `${ENDPOINT}/${id}`, null, {
          isWorkspaceScoped: false,
        }),
};
