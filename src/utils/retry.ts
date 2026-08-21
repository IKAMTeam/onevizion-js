import type { RetryConfig } from '../types/index.js';

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export function mergeRetryConfig(config?: RetryConfig): Required<RetryConfig> {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
}

export function shouldRetry(
  statusCode: number | undefined,
  attempt: number,
  config: Required<RetryConfig>,
): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  if (!statusCode) {
    // Network errors should be retried
    return true;
  }

  return config.retryableStatusCodes.includes(statusCode);
}

export function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.initialDelay * config.backoffFactor ** attempt;
  return Math.min(delay, config.maxDelay);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a Result-returning function (functional approach)
 */

/**
 * Type guard to check if value is an Error
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a statusCode property
 */
function hasStatusCode(error: Error): error is Error & { statusCode: number } {
  return (
    'statusCode' in error && typeof (error as { statusCode?: unknown }).statusCode === 'number'
  );
}

/**
 * Legacy retry function for backward compatibility (throws)
 * @deprecated Use withRetryResult for better error handling
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Required<RetryConfig>,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Proper type narrowing with type guard
      if (!isError(error)) {
        throw new Error(`Non-Error thrown: ${String(error)}`);
      }

      lastError = error;
      const statusCode = hasStatusCode(error) ? error.statusCode : undefined;

      if (!shouldRetry(statusCode, attempt, config)) {
        throw lastError;
      }

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        onRetry?.(attempt + 1, lastError);
        await sleep(delay);
      }
    }
  }

  // Type-safe: throw only when we definitely have an error
  throw lastError ?? new Error('Retry loop completed without error');
}
