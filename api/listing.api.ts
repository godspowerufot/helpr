import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import {
  ListingDetail,
  ListingList,
  ListingQuery,
} from '@/types/listing.types';
import { ReviewList } from '@/types/review.types';
import { mockApi } from './mock.api';

const ENDPOINT = '/listings';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const listingApi = {
  list: (query: ListingQuery) =>
    isMocked('listings')
      ? mockApi.listings.list(query)
      : client()<ListingList>('GET', ENDPOINT, null, {
          isWorkspaceScoped: false,
          query: {
            category: query.category,
            q: query.q,
            area: query.area,
            sort: query.sort,
            limit: query.limit,
            offset: query.offset,
            lat: query.lat,
            lng: query.lng,
            radius_km: query.radius_km,
          },
        }),
  get: (id: string) =>
    isMocked('listings')
      ? mockApi.listings.get(Number(id))
      : client()<ListingDetail>('GET', `${ENDPOINT}/${id}`, null, {
          isWorkspaceScoped: false,
        }),
  reviews: (id: string, limit: number, offset: number) =>
    isMocked('listings')
      ? mockApi.listings.reviews(Number(id), limit, offset)
      : client()<ReviewList>('GET', `${ENDPOINT}/${id}/reviews`, null, {
          isWorkspaceScoped: false,
          query: { limit, offset },
        }),
};
