import { useCallback, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { mapApi } from '@/api/map.api';
import { LatLng, NearbyQuery } from '@/types/map.types';

export const mapKeys = {
  all: ['map'] as const,
  config: () => [...mapKeys.all, 'config'] as const,
  nearby: (query: NearbyQuery) => [...mapKeys.all, 'nearby', query] as const,
};

export const useMapConfig = () =>
  useQuery({
    queryKey: mapKeys.config(),
    queryFn: () => mapApi.config(),
    staleTime: Infinity,
  });

export const useNearbyProviders = (query?: NearbyQuery) =>
  useQuery({
    queryKey: mapKeys.nearby(query as NearbyQuery),
    queryFn: () => mapApi.nearby(query as NearbyQuery),
    enabled: Boolean(query),
    placeholderData: keepPreviousData,
  });

type LocateStatus = 'idle' | 'locating' | 'error';

// Asks the browser only when the customer presses "Use My Location" (ADR 0022).
export function useDeviceLocation() {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(
    () =>
      new Promise<LatLng | null>((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setStatus('error');
          setError('This browser cannot share its location.');
          resolve(null);
          return;
        }
        setStatus('locating');
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setStatus('idle');
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (failure) => {
            setStatus('error');
            setError(
              failure.code === failure.PERMISSION_DENIED
                ? 'Location access was blocked. Allow it in your browser settings, or move the map by hand.'
                : 'Your location could not be found. Move the map by hand instead.'
            );
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
        );
      }),
    []
  );

  return { locate, status, error };
}
