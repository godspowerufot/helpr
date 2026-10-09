import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import { MapConfig, NearbyQuery, ProviderPin } from '@/types/map.types';
import { mockApi } from './mock.api';

// Public routes (ADR 0022): the region, zoom and tiles come from the backend.
const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const mapApi = {
  config: () =>
    isMocked('map')
      ? mockApi.map.config()
      : client()<MapConfig>('GET', '/map/config', null, {
          isWorkspaceScoped: false,
        }),
  nearby: (query: NearbyQuery) =>
    isMocked('map')
      ? mockApi.map.nearby(query)
      : client()<ProviderPin[]>('GET', '/providers/nearby', null, {
          isWorkspaceScoped: false,
          query: {
            lat: query.lat,
            lng: query.lng,
            radius_km: query.radius_km,
            category: query.category,
          },
        }),
};
