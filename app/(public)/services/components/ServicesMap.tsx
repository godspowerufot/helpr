'use client';

import { useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import { AppSkeleton } from '@msflib/react-components';
import AppButton from '@/components/AppButton';
import GoogleMapEmbed from '@/components/map/GoogleMapEmbed';
import { useListingQuery, useListings } from '@/hooks/listing.hooks';
import { useDeviceLocation, useMapConfig } from '@/hooks/map.hooks';
import { GLASS_CARD } from '@/styles/glass.styles';
import { ListingCard } from '@/types/listing.types';
import { LatLng } from '@/types/map.types';
import { googleMapsLink, isInBounds } from '@/utils/geo.utils';
import { formatMoney } from '@/utils/money.utils';

const RADII = [2, 5, 10];
const MAP_SIZE = 'h-80 sm:h-[26rem] lg:h-full lg:min-h-80';
const PANEL = `${GLASS_CARD} flex flex-col gap-3 p-3 lg:h-[calc(100dvh-9rem)]`;

const pointOf = (listing: ListingCard | null): LatLng | null =>
  listing?.latitude != null && listing.longitude != null
    ? { lat: listing.latitude, lng: listing.longitude }
    : null;

interface ServicesMapProps {
  active: ListingCard | null;
  onSelect: (listing: ListingCard) => void;
}

export default function ServicesMap({ active, onSelect }: ServicesMapProps) {
  const config = useMapConfig();
  const { near, setNear, query } = useListingQuery();
  const listings = useListings(query);
  const { locate, status, error } = useDeviceLocation();
  const [notice, setNotice] = useState<string | null>(null);

  const region = config.data;

  if (config.isLoading) {
    return (
      <section aria-busy="true" aria-label="Map" className={PANEL}>
        <AppSkeleton.Text lines={1} />
        <div
          aria-hidden="true"
          className={`w-full flex-1 rounded-modal bg-glass/42 ${MAP_SIZE}`}
        />
      </section>
    );
  }

  if (config.isError || !region) {
    return (
      <section
        role="alert"
        className={`${GLASS_CARD} flex flex-col items-start gap-3 p-5`}
      >
        <p className="b1-r text-error">
          The map could not be loaded. The list still shows every service.
        </p>
        <AppButton variant="outlined" onClick={() => config.refetch()}>
          Try Again
        </AppButton>
      </section>
    );
  }

  const center: LatLng = near ?? {
    lat: region.center_lat,
    lng: region.center_lng,
  };
  const radii = [...new Set([...RADII, region.max_radius_km])].filter(
    (r) => r <= region.max_radius_km
  );
  const activePoint = pointOf(active);
  const focus = activePoint ?? center;
  const zoom = activePoint
    ? Math.min(region.default_zoom + 3, region.max_zoom)
    : region.default_zoom;
  const mappable = (listings.data?.items ?? []).filter((l) => pointOf(l));

  const useMyLocation = async () => {
    setNotice(null);
    const point = await locate();
    if (!point) return;
    if (!isInBounds(point, region.bounds)) {
      setNotice(
        `You appear to be outside ${region.region_name}, so the map stays on ${region.region_name}. Helpr only serves ${region.region_name} for now.`
      );
      return;
    }
    setNear({
      ...point,
      radius_km: near?.radius_km ?? region.default_radius_km,
    });
  };

  const caption = active
    ? activePoint
      ? `Showing ${active.title} by ${active.provider.display_name}.`
      : `${active.title} has no map location yet.`
    : `Showing ${near ? 'your area' : region.region_name}. Select a service to see where it is.`;

  return (
    <section aria-labelledby="services-map-heading" className={PANEL}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
        <h2 id="services-map-heading" className="b2-m text-text">
          Map of {region.region_name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={near?.radius_km ?? null}
            aria-label="Only show services within"
            className="rounded-full border border-glass/70 bg-glass/42 p-1 backdrop-blur-[18px]"
            sx={{
              gap: 0.5,
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: 'var(--button-radius) !important',
                color: 'var(--text-light)',
              },
              '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover':
                { backgroundColor: 'var(--ink)', color: 'var(--on-primary)' },
            }}
            onChange={(_, value: number | null) => {
              if (!value) return;
              setNear({ lat: center.lat, lng: center.lng, radius_km: value });
            }}
          >
            {radii.map((r) => (
              <ToggleButton
                key={r}
                value={r}
                aria-label={`${r} kilometres`}
                sx={{ minHeight: 44, minWidth: 52, textTransform: 'none' }}
              >
                <span className="f1-m tabular-nums">{r} km</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <AppButton
            variant="outlined"
            loading={status === 'locating'}
            onClick={useMyLocation}
            startIcon={<MyLocationOutlined aria-hidden="true" />}
          >
            Use My Location
          </AppButton>
          {near ? (
            <AppButton variant="text" onClick={() => setNear(undefined)}>
              Any Distance
            </AppButton>
          ) : null}
        </div>
      </div>

      {error || notice ? (
        <p className="b2-r px-1 text-text" role="status">
          {error ?? notice}
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        <GoogleMapEmbed
          point={focus}
          zoom={zoom}
          sizeClassName={MAP_SIZE}
          title={
            active && activePoint
              ? `Map showing ${active.title}`
              : `Map of ${region.region_name}`
          }
        />
      </div>

      <p
        className="f1-r flex flex-wrap justify-between gap-2 px-1 text-text-light"
        aria-live="polite"
      >
        <span className="min-w-0">{caption}</span>
        <a
          href={googleMapsLink(focus)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          Open in Google Maps
        </a>
      </p>

      {mappable.length > 0 ? (
        <ul
          aria-label="Show a service on the map"
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 lg:hidden"
        >
          {mappable.map((listing) => {
            const isActive = listing.id === active?.id;
            return (
              <li key={listing.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelect(listing)}
                  className={`flex min-h-11 max-w-[16rem] flex-col rounded-card border px-3 py-2 text-left backdrop-blur-[18px] transition-[background-color,border-color] duration-200 ${isActive ? 'border-ink bg-glass/80' : 'border-glass/70 bg-glass/42 hover:bg-glass/70'}`}
                >
                  <span className="b2-m truncate text-text">
                    {listing.title}
                  </span>
                  <span className="f1-r tabular-nums text-text-light">
                    {formatMoney(listing.price_amount, listing.currency)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
