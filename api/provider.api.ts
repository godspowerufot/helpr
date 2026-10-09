import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import {
  ProviderDetail,
  ProviderMine,
  ProviderWrite,
} from '@/types/provider.types';
import { mockApi } from './mock.api';

const ENDPOINT = '/providers';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const providerApi = {
  get: (slug: string) =>
    isMocked('providers')
      ? mockApi.providers.get(slug)
      : client()<ProviderDetail>('GET', `${ENDPOINT}/${slug}`, null, {
          isWorkspaceScoped: false,
        }),
  create: (body: ProviderWrite) =>
    isMocked('provider-onboarding')
      ? mockApi.providers.create(body)
      : client()<ProviderMine>('POST', ENDPOINT, body, {
          isWorkspaceScoped: false,
        }),
  blockedDays: (slug: string) =>
    isMocked('providers')
      ? mockApi.providers.blockedDays(slug)
      : client()<string[]>('GET', `${ENDPOINT}/${slug}/blocked-days`, null, {
          isWorkspaceScoped: false,
        }),
  mine: () =>
    isMocked('provider-onboarding')
      ? mockApi.providers.mine()
      : client()<ProviderMine[]>('GET', `${ENDPOINT}/mine`, null, {
          isWorkspaceScoped: false,
        }),
};
