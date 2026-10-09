import { LayoutProps } from '@msflib/react-components';

export function ProviderLayout({ FormField }: LayoutProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField elementName="display_name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField elementName="service_area" />
        <FormField elementName="phone" />
      </div>
      <FormField elementName="bio" />
      <div>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}
