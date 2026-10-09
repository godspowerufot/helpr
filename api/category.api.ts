import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import { CategoryPublic } from '@/types/listing.types';
import { mockApi } from './mock.api';

const ENDPOINT = '/categories';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const categoryApi = {
  list: () =>
    isMocked('categories')
      ? mockApi.categories.list()
      : client()<CategoryPublic[]>('GET', ENDPOINT, null, {
          isWorkspaceScoped: false,
        }),
};
