import { FormElement } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import { toDateKey } from '@/utils/date.utils';

export type BlockDayFormData = { day: string; note: string };

export const blockDayElements = (blockedDays: string[]): FormElement[] => [
  {
    id: 'day',
    name: 'day',
    label: 'Day off',
    eType: 'date',
    dType: 'string',
    mData: baseMData,
    validation: {
      required: { value: true, message: 'Pick a day.' },
      validate: (value: string) => {
        if (value < toDateKey(new Date())) return 'Pick today or a later day.';
        if (blockedDays.includes(value)) return 'That day is already blocked.';
        return true;
      },
    },
  },
  {
    id: 'note',
    name: 'note',
    label: 'Note for yourself (optional)',
    eType: 'text',
    dType: 'string',
    placeholder: 'e.g. Family event…',
    mData: baseMData,
    validation: {
      maxLength: { value: 140, message: 'Keep it under 140 characters.' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: 'Block Day',
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];
