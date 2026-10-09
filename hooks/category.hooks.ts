import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/api/category.api';

export const categoryKeys = {
  all: ['category'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.list(),
    queryFn: categoryApi.list,
  });
