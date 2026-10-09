import { FormElement } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';

export const providerElements = (submitLabel: string): FormElement[] => [
  {
    id: 'display_name',
    name: 'display_name',
    label: 'Business name',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Ini’s Home Cleaning…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter the name customers will see.' },
      minLength: { value: 2, message: 'Use at least 2 characters.' },
      maxLength: { value: 120, message: 'Keep it under 120 characters.' },
    },
  },
  {
    id: 'service_area',
    name: 'service_area',
    label: 'Area you cover',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Eket, Afaha Eket, Ikot Udoma…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter the area you work in.' },
      minLength: { value: 2, message: 'Use at least 2 characters.' },
      maxLength: { value: 200, message: 'Keep it under 200 characters.' },
    },
  },
  {
    id: 'phone',
    name: 'phone',
    label: 'Phone',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. 0803 123 4567…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter a phone number.' },
      pattern: {
        value: /^[+\d][\d\s-]{6,31}$/,
        message: 'Use digits, spaces or dashes, e.g. 0803 123 4567.',
      },
    },
  },
  {
    id: 'bio',
    name: 'bio',
    label: 'About your business (optional)',
    eType: 'textarea',
    dType: 'string',
    placeholder: 'What you do, years of experience, what customers can expect…',
    mData: { ...baseMData, rows: 4 },
    validation: {
      maxLength: { value: 2000, message: 'Keep it under 2,000 characters.' },
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
