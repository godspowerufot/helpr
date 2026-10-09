// `configuredApiClient` rejects with `ApiResponseError` ({ status, message = backend `detail` }).
export function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

export function errorMessage(error: unknown, fallback: string) {
  const status = errorStatus(error);
  // 4xx details are written for people ("This is not your booking."); 5xx are not.
  if (status && status >= 400 && status < 500 && error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
