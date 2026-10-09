'use client';

import { createContext, useContext } from 'react';
import { LayoutProps } from '@msflib/react-components';
import AppButton from '@/components/AppButton';

export const StepContext = createContext<{ onBack?: () => void }>({});

export function StepLayout({ FormField, elements }: LayoutProps) {
  const { onBack } = useContext(StepContext);
  return (
    <div className="flex flex-col gap-5">
      {elements
        .filter((element) => element.name !== 'submit')
        .map((element) => (
          <FormField key={element.name} elementName={element.name} />
        ))}
      <div className="flex flex-wrap items-center gap-2">
        <FormField elementName="submit" />
        {onBack ? (
          <AppButton variant="text" onClick={onBack}>
            Back
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}

export function WhenLayout({ FormField }: LayoutProps) {
  const { onBack } = useContext(StepContext);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField elementName="date" />
        <FormField elementName="time" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FormField elementName="submit" />
        {onBack ? (
          <AppButton variant="text" onClick={onBack}>
            Back
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}
