import { configuredApiClient } from '@msflib/core';
import { asFormData } from '@msflib/typescript';
import { isMocked } from '@/constant/app.constant';
import {
  BookingDetail,
  BookingQuery,
  BookingReason,
  BookingSummary,
  ProviderBookingAction,
} from '@/types/booking.types';
import { ListingWrite, ProviderListing } from '@/types/listing.types';
import {
  BlockedDay,
  BlockedDayWrite,
  Earnings,
  ProviderMine,
  ProviderPhoto,
  ProviderWrite,
} from '@/types/provider.types';
import { mockApi } from './mock.api';

// `workspaceHookDecorator('path')` turns `/provider/...` into `/{workspace_slug}/provider/...`.
const ENDPOINT = '/provider';

const client = () => configuredApiClient({ isWorkspaceScoped: true }).apiClient;
const formClient = () =>
  configuredApiClient({ isWorkspaceScoped: true }).apiFormDataClient;

export const providerWorkspaceApi = {
  get: () =>
    isMocked('provider-workspace')
      ? mockApi.provider.get()
      : client()<ProviderMine>('GET', ENDPOINT),
  update: (body: Partial<ProviderWrite>) =>
    isMocked('provider-workspace')
      ? mockApi.provider.update(body)
      : client()<ProviderMine>('PATCH', ENDPOINT, body),
  earnings: () =>
    isMocked('provider-workspace')
      ? mockApi.provider.earnings()
      : client()<Earnings>('GET', `${ENDPOINT}/earnings`),

  photos: {
    setProfile: (file: File) =>
      isMocked('provider-workspace')
        ? mockApi.provider.photos.setProfile(file)
        : formClient()<ProviderMine>(
            'POST',
            `${ENDPOINT}/photo`,
            asFormData({ file })
          ),
    removeProfile: () =>
      isMocked('provider-workspace')
        ? mockApi.provider.photos.removeProfile()
        : client()<ProviderMine>('DELETE', `${ENDPOINT}/photo`),
    add: (file: File, caption: string) =>
      isMocked('provider-workspace')
        ? mockApi.provider.photos.add(file, caption)
        : formClient()<ProviderPhoto>(
            'POST',
            `${ENDPOINT}/photos`,
            asFormData({ file, caption })
          ),
    remove: (id: number) =>
      isMocked('provider-workspace')
        ? mockApi.provider.photos.remove(id)
        : client()<ProviderMine>('DELETE', `${ENDPOINT}/photos/${id}`),
  },

  blockedDays: {
    list: () =>
      isMocked('provider-workspace')
        ? mockApi.provider.blockedDays.list()
        : client()<BlockedDay[]>('GET', `${ENDPOINT}/blocked-days`),
    add: (body: BlockedDayWrite) =>
      isMocked('provider-workspace')
        ? mockApi.provider.blockedDays.add(body)
        : client()<BlockedDay>('POST', `${ENDPOINT}/blocked-days`, body),
    remove: (day: string) =>
      isMocked('provider-workspace')
        ? mockApi.provider.blockedDays.remove(day)
        : client()<BlockedDay[]>('DELETE', `${ENDPOINT}/blocked-days/${day}`),
  },

  listings: {
    list: () =>
      isMocked('provider-workspace')
        ? mockApi.provider.listings.list()
        : client()<ProviderListing[]>('GET', `${ENDPOINT}/listings`),
    create: (body: ListingWrite) =>
      isMocked('provider-workspace')
        ? mockApi.provider.listings.create(body)
        : client()<ProviderListing>('POST', `${ENDPOINT}/listings`, body),
    update: (id: string, body: Partial<ListingWrite>) =>
      isMocked('provider-workspace')
        ? mockApi.provider.listings.update(Number(id), body)
        : client()<ProviderListing>(
            'PATCH',
            `${ENDPOINT}/listings/${id}`,
            body
          ),
    setStatus: (id: string, action: 'publish' | 'archive') =>
      isMocked('provider-workspace')
        ? mockApi.provider.listings.setStatus(Number(id), action)
        : client()<ProviderListing>(
            'POST',
            `${ENDPOINT}/listings/${id}/${action}`
          ),
  },

  bookings: {
    list: (query: BookingQuery) =>
      isMocked('provider-workspace')
        ? mockApi.provider.bookings.list(query)
        : client()<BookingSummary[]>('GET', `${ENDPOINT}/bookings`, null, {
            query: { status: query.status },
          }),
    get: (id: string) =>
      isMocked('provider-workspace')
        ? mockApi.provider.bookings.get(Number(id))
        : client()<BookingDetail>('GET', `${ENDPOINT}/bookings/${id}`),
    act: (
      id: string,
      action: ProviderBookingAction,
      body: BookingReason = {}
    ) =>
      isMocked('provider-workspace')
        ? mockApi.provider.bookings.act(Number(id), action, body)
        : client()<BookingDetail>(
            'POST',
            `${ENDPOINT}/bookings/${id}/${action}`,
            body
          ),
  },
};
