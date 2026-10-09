'use client';

import { useEffect, useRef, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import MapOutlined from '@mui/icons-material/MapOutlined';
import { useListingQuery } from '@/hooks/listing.hooks';
import { ListingCard, ServicesView } from '@/types/listing.types';
import ListingResults from './ListingResults';
import ServicesMap from './ServicesMap';

// Hovering across several cards should not reload the map for each one.
const HOVER_DELAY_MS = 250;

const VIEWS: { value: ServicesView; label: string; icon: React.ReactNode }[] = [
  {
    value: 'services',
    label: 'List',
    icon: <GridViewOutlined fontSize="small" aria-hidden="true" />,
  },
  {
    value: 'map',
    label: 'Map',
    icon: <MapOutlined fontSize="small" aria-hidden="true" />,
  },
];

export default function ServicesSplit() {
  const { view, setView } = useListingQuery();
  const [active, setActive] = useState<ListingCard | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPreview = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const preview = (listing: ListingCard, immediate = false) => {
    cancelPreview();
    if (immediate) setActive(listing);
    else timer.current = setTimeout(() => setActive(listing), HOVER_DELAY_MS);
  };

  useEffect(() => {
    const pending = timer;
    return () => {
      if (pending.current) clearTimeout(pending.current);
    };
  }, []);

  return (
    <div className="mt-6">
      <div className="mb-4 lg:hidden">
        <ToggleButtonGroup
          exclusive
          value={view}
          aria-label="Show services as"
          onChange={(_, next: ServicesView | null) => {
            if (next) setView(next);
          }}
          className="rounded-full border border-glass/70 bg-glass/42 p-1 shadow-glass backdrop-blur-[18px]"
          sx={{
            gap: 0.5,
            '& .MuiToggleButton-root': {
              border: 0,
              borderRadius: 'var(--button-radius) !important',
              color: 'var(--text-light)',
              gap: 1,
            },
            '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover':
              { backgroundColor: 'var(--ink)', color: 'var(--on-primary)' },
          }}
        >
          {VIEWS.map((v) => (
            <ToggleButton
              key={v.value}
              value={v.value}
              sx={{ minHeight: 44, px: 2.25, textTransform: 'none' }}
            >
              {v.icon}
              <span className="b2-m">{v.label}</span>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div
          id="services-results"
          tabIndex={-1}
          className={`min-w-0 ${view === 'map' ? 'hidden lg:block' : ''}`}
        >
          <ListingResults
            activeId={active?.id}
            onPreview={preview}
            onPreviewEnd={cancelPreview}
          />
        </div>
        <div
          className={`min-w-0 lg:sticky lg:top-28 ${view === 'map' ? '' : 'hidden lg:block'}`}
        >
          <ServicesMap active={active} onSelect={setActive} />
        </div>
      </div>
    </div>
  );
}
