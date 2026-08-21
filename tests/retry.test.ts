import { describe, expect, it, vi } from 'vitest';
import { calculateDelay, mergeRetryConfig, shouldRetry, withRetry } from '../src/utils/retry.js';

describe('Retry utilities', () => {
  describe('mergeRetryConfig', () => {
    it('should return default config when no config provided', () => {
      const config = mergeRetryConfig();
      expect(config).toEqual({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      });
    });

    it('should merge custom config with defaults', () => {
      const config = mergeRetryConfig({ maxRetries: 5, initialDelay: 500 });
      expect(config.maxRetries).toBe(5);
      expect(config.initialDelay).toBe(500);
      expect(config.backoffFactor).toBe(2); // default
    });
  });

  describe('shouldRetry', () => {
    const config = mergeRetryConfig();

    it('should not retry when max retries reached', () => {
      expect(shouldRetry(500, 3, config)).toBe(false);
    });

    it('should retry network errors (no status code)', () => {
      expect(shouldRetry(undefined, 0, config)).toBe(true);
    });

    it('should retry retryable status codes', () => {
      expect(shouldRetry(429, 0, config)).toBe(true);
      expect(shouldRetry(500, 0, config)).toBe(true);
      expect(shouldRetry(503, 0, config)).toBe(true);
    });

    it('should not retry non-retryable status codes', () => {
      expect(shouldRetry(400, 0, config)).toBe(false);
      expect(shouldRetry(404, 0, config)).toBe(false);
    });
  });

  describe('calculateDelay', () => {
    const config = mergeRetryConfig();

    it('should calculate exponential backoff', () => {
      expect(calculateDelay(0, config)).toBe(1000);
      expect(calculateDelay(1, config)).toBe(2000);
      expect(calculateDelay(2, config)).toBe(4000);
    });

    it('should cap delay at maxDelay', () => {
      expect(calculateDelay(10, config)).toBe(10000);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const config = mergeRetryConfig();

      const result = await withRetry(fn, config);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error('fail'), { statusCode: 500 }))
        .mockRejectedValueOnce(Object.assign(new Error('fail'), { statusCode: 500 }))
        .mockResolvedValue('success');

      const config = mergeRetryConfig({ initialDelay: 10 }); // Fast retries for testing

      const result = await withRetry(fn, config);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(Object.assign(new Error('fail'), { statusCode: 500 }));
      const config = mergeRetryConfig({ maxRetries: 2, initialDelay: 10 });

      await expect(withRetry(fn, config)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValue(Object.assign(new Error('not found'), { statusCode: 404 }));
      const config = mergeRetryConfig();

      await expect(withRetry(fn, config)).rejects.toThrow('not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error('fail'), { statusCode: 500 }))
        .mockResolvedValue('success');

      const onRetry = vi.fn();
      const config = mergeRetryConfig({ initialDelay: 10 });

      await withRetry(fn, config, onRetry);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });
});
