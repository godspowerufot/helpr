import { getApplicationConfig } from '@msflib/core';

/** Stored files are served from the API origin, outside `/api/v1` (ADR 0027). */
export function mediaUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  return new URL(url, getApplicationConfig().baseURL).toString();
}
