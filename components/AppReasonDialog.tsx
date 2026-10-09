'use client';

import { createContext, useContext, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { FormElement, LayoutProps } from '@msflib/react-components';
import FormBuilder from '@/dynamics/FormBuilder';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import AppButton from './AppButton';

const CloseContext = createContext({
  onClose: () => undefined as void,
  dismissLabel: 'Go Back',
});

function ReasonLayout({ FormField }: LayoutProps) {
  const { onClose, dismissLabel } = useContext(CloseContext);
  return (
    <div className="flex flex-col gap-4">
      <FormField elementName="reason" />
      <div className="flex flex-wrap justify-end gap-2">
        <AppButton variant="text" onClick={onClose}>
          {dismissLabel}
        </AppButton>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}

const elements = (required: boolean, confirmLabel: string): FormElement[] => [
  {
    id: 'reason',
    name: 'reason',
    label: required ? 'Reason' : 'Reason (optional)',
    eType: 'textarea',
    dType: 'string',
    placeholder: 'e.g. I can no longer make that day…',
    mData: { ...baseMData, rows: 3 },
    validation: {
      ...(required && {
        required: { value: true, message: 'Tell the other side why.' },
      }),
      maxLength: { value: 500, message: 'Keep it under 500 characters.' },
    },
  },
  {
    id: 'submit',
    name: 'submit',
    label: confirmLabel,
    eType: 'button',
    dType: 'submit',
    mData: {
      variant: 'contained',
      sx: buttonStyle(),
    },
  },
];

interface AppReasonDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  dismissLabel?: string;
  required?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function AppReasonDialog({
  open,
  title,
  message,
  confirmLabel,
  dismissLabel = 'Go Back',
  required = false,
  loading = false,
  onConfirm,
  onClose,
}: AppReasonDialogProps) {
  const [formData, setFormData] = useState<{ reason?: string }>({});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { overscrollBehavior: 'contain' } } }}
    >
      <DialogTitle className="h5-m">{title}</DialogTitle>
      <DialogContent>
        <p className="b2-r mb-4 text-text-light">{message}</p>
        <CloseContext.Provider value={{ onClose, dismissLabel }}>
          <FormBuilder
            elements={elements(required, confirmLabel)}
            layout={ReasonLayout}
            formData={formData}
            setFormData={setFormData}
            loadingState={loading}
            onSubmit={(data: { reason?: string }) =>
              onConfirm((data.reason ?? '').trim())
            }
          />
        </CloseContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
