import { LayoutProps } from '@msflib/react-components';

export function BlockDayLayout({ FormField }: LayoutProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField elementName="day" />
        <FormField elementName="note" />
      </div>
      <div>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}
