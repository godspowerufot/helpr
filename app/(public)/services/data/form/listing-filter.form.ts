import { FormElement, OptionItem } from '@msflib/react-components';
import { baseMData, buttonStyle } from '@/styles/form.styles';
import { CategoryPublic, ListingSort } from '@/types/listing.types';

const sortOptions: (OptionItem & { value: '' | ListingSort })[] = [
  { value: '', label: 'Any order' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Nearest first' },
];

export function listingFilterElements(
  categories: CategoryPublic[]
): FormElement[] {
  const categoryOptions: OptionItem[] = [
    { value: '', label: 'All categories' },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  return [
    {
      id: 'q',
      name: 'q',
      label: 'Search',
      eType: 'text',
      dType: 'string',
      placeholder: 'Service name or keyword…',
      mData: baseMData,
    },
    {
      id: 'category',
      name: 'category',
      label: 'Category',
      eType: 'select',
      dType: 'string',
      mData: { ...baseMData, select: true, options: categoryOptions },
    },
    {
      id: 'area',
      name: 'area',
      label: 'Area',
      eType: 'text',
      dType: 'string',
      placeholder: 'City or area…',
      mData: baseMData,
    },
    {
      id: 'sort',
      name: 'sort',
      label: 'Sort',
      eType: 'select',
      dType: 'string',
      mData: { ...baseMData, select: true, options: sortOptions },
    },
    {
      id: 'submit',
      name: 'submit',
      label: 'Search',
      eType: 'button',
      dType: 'submit',
      mData: {
        variant: 'contained',
        sx: { ...buttonStyle(), minHeight: 44, width: '100%' },
      },
    },
  ];
}
