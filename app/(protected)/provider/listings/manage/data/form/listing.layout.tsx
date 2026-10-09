import { LayoutProps } from '@msflib/react-components';

export function ListingLayout({ FormField }: LayoutProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField elementName="category_slug" />
        <FormField elementName="service_area" />
      </div>
      <FormField elementName="title" />
      <FormField elementName="description" />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField elementName="pricing_type" />
        <FormField elementName="price_naira" />
        <FormField elementName="duration_minutes" />
      </div>
      <div>
        <FormField elementName="submit" />
      </div>
    </div>
  );
}
