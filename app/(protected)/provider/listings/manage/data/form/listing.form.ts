import { FormElement, OptionItem } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import { CategoryPublic } from '@/types/listing.types';
import { formatDuration } from '@/utils/listing.utils';

export type ListingForm = {
  category_slug: string;
  title: string;
  description: string;
  pricing_type: 'fixed' | 'hourly';
  price_naira: string;
  duration_minutes: string;
  service_area: string;
};

const durationOptions: OptionItem[] = [
  { value: '', label: 'Not fixed' },
  ...[30, 60, 90, 120, 180, 240, 360, 480].map((m) => ({
    value: String(m),
    label: formatDuration(m) ?? '',
  })),
];

export const listingElements = (
  categories: CategoryPublic[],
  submitLabel: string
): FormElement[] => [
  {
    id: 'category_slug',
    name: 'category_slug',
    label: 'Category',
    eType: 'select',
    dType: 'string',
    mData: {
      ...baseMData,
      select: true,
      options: categories.map((c) => ({ value: c.slug, label: c.name })),
    },
    validation: { required: { value: true, message: 'Pick a category.' } },
  },
  {
    id: 'title',
    name: 'title',
    label: 'Service name',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Deep clean, 3-bedroom flat…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Name the service.' },
      minLength: { value: 3, message: 'Use at least 3 characters.' },
      maxLength: { value: 120, message: 'Keep it under 120 characters.' },
    },
  },
  {
    id: 'description',
    name: 'description',
    label: 'What is included',
    eType: 'textarea',
    dType: 'string',
    placeholder:
      'What you do, what you bring, what the customer should prepare…',
    mData: { ...baseMData, rows: 5 },
    validation: {
      required: { value: true, message: 'Describe the service.' },
      minLength: { value: 10, message: 'Write at least 10 characters.' },
      maxLength: { value: 4000, message: 'Keep it under 4,000 characters.' },
    },
  },
  {
    id: 'pricing_type',
    name: 'pricing_type',
    label: 'Pricing',
    eType: 'select',
    dType: 'string',
    mData: {
      ...baseMData,
      select: true,
      options: [
        { value: 'fixed', label: 'Fixed price per job' },
        { value: 'hourly', label: 'Per hour' },
      ],
    },
    validation: { required: { value: true, message: 'Pick how you charge.' } },
  },
  {
    id: 'price_naira',
    name: 'price_naira',
    label: 'Price (₦)',
    eType: 'number',
    dType: 'number',
    placeholder: 'e.g. 15000…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter a price.' },
      validate: (value: string) => {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) return 'Enter a price above ₦0.';
        if (Math.round(n * 100) !== n * 100)
          return 'Use at most 2 decimal places.';
        return true;
      },
    },
  },
  {
    id: 'duration_minutes',
    name: 'duration_minutes',
    label: 'Usual duration',
    eType: 'select',
    dType: 'string',
    mData: { ...baseMData, select: true, options: durationOptions },
  },
  {
    id: 'service_area',
    name: 'service_area',
    label: 'Area covered',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Eket and Afaha Eket…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter the area you cover.' },
      minLength: { value: 2, message: 'Use at least 2 characters.' },
      maxLength: { value: 200, message: 'Keep it under 200 characters.' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: submitLabel,
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];
