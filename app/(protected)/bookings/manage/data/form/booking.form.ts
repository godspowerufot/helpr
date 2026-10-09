import { FormElement, OptionItem } from '@msflib/react-components';
import { TIME_SLOTS } from '@/constant/booking.constant';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import { toDateKey } from '@/utils/date.utils';

const continueButton = (label = 'Continue'): FormElement => ({
  id: 'submit',
  name: 'submit',
  label,
  eType: 'button',
  dType: 'submit',
  mData: {
    variant: 'contained',
    sx: buttonStyle(),
  },
});

export const serviceElements = (options: OptionItem[]): FormElement[] => [
  {
    id: 'listing_id',
    name: 'listing_id',
    label: 'Which service do you need?',
    eType: 'radio',
    dType: 'string',
    mData: { options },
    validation: { required: { value: true, message: 'Pick a service.' } },
  },
  continueButton(),
];

const timeOptions: OptionItem[] = TIME_SLOTS.map((slot) => ({
  value: slot,
  label: slot,
}));

export const BLOCKED_DAY_MESSAGE =
  'The provider is not available that day. Pick another date.';

export const whenElements = (blockedDays: string[]): FormElement[] => [
  {
    id: 'date',
    name: 'date',
    label: 'Date',
    eType: 'date',
    dType: 'string',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Pick a date.' },
      validate: (value: string) => {
        if (value < toDateKey(new Date())) return 'Pick today or a later date.';
        if (blockedDays.includes(value)) return BLOCKED_DAY_MESSAGE;
        return true;
      },
    },
  },
  {
    id: 'time',
    name: 'time',
    label: 'Start time',
    eType: 'select',
    dType: 'string',
    mData: { ...baseMData, select: true, options: timeOptions },
    validation: {
      required: { value: true, message: 'Pick a start time.' },
      validate: (value: string, values: { date?: string }) =>
        !values.date ||
        new Date(`${values.date}T${value}:00`) > new Date() ||
        'That time has passed. Pick a later one.',
    },
  },
  continueButton(),
];

export const whereElements = (): FormElement[] => [
  {
    id: 'address',
    name: 'address',
    label: 'Address',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. 12 Hospital Road, Eket…',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Enter the address for the job.' },
      minLength: { value: 3, message: 'Enter the full address.' },
      maxLength: { value: 300, message: 'Keep it under 300 characters.' },
    },
  },
  {
    id: 'notes',
    name: 'notes',
    label: 'Notes for the provider (optional)',
    eType: 'textarea',
    dType: 'string',
    placeholder: 'What needs doing, gate code, a phone number to reach you…',
    mData: { ...baseMData, rows: 4 },
    validation: {
      maxLength: { value: 2000, message: 'Keep it under 2,000 characters.' },
    },
  },
  continueButton('Review Request'),
];
