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

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Required<RetryConfig>,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const statusCode = 'statusCode' in lastError ? (lastError.statusCode as number) : undefined;

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

  // If we get here, all retries failed - throw the last error
  throw lastError;
}
