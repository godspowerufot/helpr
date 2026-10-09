'use client';

import { resolveWorkspace } from '@/utils/resolveWorkspace';
import { configureApplication } from '@msflib/core';
import { workspaceHookDecorator } from '@msflib/react-workspace';

export function initMsflib() {
  const multiTenantResolver = resolveWorkspace();
  const accessTokenKey =
    process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'helpr_access_token';

  configureApplication({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1',
    accessTokenKey: accessTokenKey,
    apiClientDecorator: multiTenantResolver.enabled
      ? workspaceHookDecorator(multiTenantResolver.strategy)
      : undefined,
    endpoints: {
      auth: {
        register: '/open',
      },
    },
  });
}
