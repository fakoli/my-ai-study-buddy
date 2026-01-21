/**
 * Extracts a human-readable error message from an unknown error value.
 * This provides type-safe error message extraction without type assertions.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as Record<string, unknown>).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Checks if an error is an API error with a specific status code.
 * Useful for handling specific HTTP errors like 402 (insufficient tokens).
 */
export function isApiErrorWithStatus(error: unknown, status: number): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errObj = error as Record<string, unknown>;

  // Check if it has a status property matching the expected value
  if (errObj.status === status) {
    return true;
  }

  // Also check if it's an ApiError by name
  if (errObj.name === 'ApiError' && errObj.status === status) {
    return true;
  }

  return false;
}

/**
 * Checks if an error indicates insufficient tokens (HTTP 402).
 */
export function isInsufficientTokensError(error: unknown): boolean {
  return isApiErrorWithStatus(error, 402);
}
