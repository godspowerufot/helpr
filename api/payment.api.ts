import { configuredApiClient } from '@msflib/core';
import { isMocked } from '@/constant/app.constant';
import { PaymentRead } from '@/types/payment.types';
import { mockApi } from './mock.api';

// msflib-payments router (ADR 0019); only the paying account can read its payments.
const ENDPOINT = '/payments';

const client = () =>
  configuredApiClient({ isWorkspaceScoped: false }).apiClient;

export const paymentApi = {
  verify: (reference: string) =>
    isMocked('payments')
      ? mockApi.payments.verify(reference)
      : client()<PaymentRead>(
          'GET',
          `${ENDPOINT}/verify/${encodeURIComponent(reference)}`,
          null,
          { isWorkspaceScoped: false }
        ),
  get: (id: string) =>
    isMocked('payments')
      ? mockApi.payments.get(Number(id))
      : client()<PaymentRead>('GET', `${ENDPOINT}/${id}`, null, {
          isWorkspaceScoped: false,
        }),
};
