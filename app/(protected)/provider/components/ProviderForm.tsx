'use client';

import { useState } from 'react';
import AppButton from '@/components/AppButton';
import FormBuilder from '@/dynamics/FormBuilder';
import { useDeviceLocation } from '@/hooks/map.hooks';
import { ProviderWrite } from '@/types/provider.types';
import { providerElements } from '../data/form/provider.form';
import { ProviderLayout } from '../data/form/provider.layout';

type Point = { lat: number; lng: number };

interface ProviderFormProps {
  initial?: Partial<ProviderWrite>;
  submitLabel: string;
  loading: boolean;
  onSubmit: (body: ProviderWrite) => void;
}

export default function ProviderForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
}: ProviderFormProps) {
  const [formData, setFormData] = useState({
    display_name: initial?.display_name ?? '',
    service_area: initial?.service_area ?? '',
    phone: initial?.phone ?? '',
    bio: initial?.bio ?? '',
  });
  const [point, setPoint] = useState<Point | null>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null
  );
  const { locate, status, error } = useDeviceLocation();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2 rounded-card bg-background-light p-4">
        <p className="b2-m text-text">Where customers find you on the map</p>
        <p className="b2-r text-text-light" aria-live="polite">
          {error ??
            (point
              ? `Pinned at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}. Customers nearby see you first.`
              : 'Share your location from where you usually work so nearby customers see you first.')}
        </p>
        <AppButton
          variant="outlined"
          loading={status === 'locating'}
          onClick={async () => {
            const next = await locate();
            if (next) setPoint(next);
          }}
        >
          {point ? 'Update Location' : 'Share My Location'}
        </AppButton>
      </div>

      <FormBuilder
        elements={providerElements(submitLabel)}
        layout={ProviderLayout}
        formData={formData}
        setFormData={setFormData}
        loadingState={loading}
        onSubmit={(data: typeof formData) =>
          onSubmit({
            display_name: data.display_name.trim(),
            service_area: data.service_area.trim(),
            phone: data.phone.trim(),
            bio: (data.bio ?? '').trim(),
            latitude: point?.lat ?? null,
            longitude: point?.lng ?? null,
          })
        }
      />
    </div>
  );
}
