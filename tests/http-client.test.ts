import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenAuth } from '../src/auth/token.js';
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '../src/utils/errors.js';
import { HttpClient } from '../src/utils/http-client.js';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let fetchMock: Mock;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://test.onevizion.com',
      auth: new TokenAuth('test-token'),
    });
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should add Bearer token to requests', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      await httpClient.get('v3/trackors/123');

      expect(fetchMock).toHaveBeenCalled();
      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.headers.get('Authorization')).toBe('Bearer test-token');
    });
  });

  describe('GET requests', () => {
    it('should return data on success', async () => {
      const mockData = { id: 123, name: 'Test Trackor' };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await httpClient.get<typeof mockData>('v3/trackors/123');

      expect(result).toEqual(mockData);
    });

    it('should build correct URL', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await httpClient.get('v3/trackors/123');

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors/123');
    });
  });

  describe('POST requests', () => {
    it('should send body as JSON', async () => {
      const postData = { trackorType: 'Asset', fields: { name: 'Test' } };
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 456, ...postData }),
      });

      await httpClient.post('v3/trackors', postData);

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.method).toBe('POST');
      const body = await request.text();
      expect(JSON.parse(body)).toEqual(postData);
    });
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError for 401', async () => {
      // Create client with no retries to avoid timeout
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
        headers: new Headers(),
      });

      await expect(noRetryClient.get('v3/trackors')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError for 404', async () => {
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Resource not found',
        headers: new Headers(),
      });

      await expect(noRetryClient.get('v3/trackors/999')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for 400', async () => {
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ message: 'Invalid fields' }),
        headers: new Headers(),
      });

      await expect(noRetryClient.post('v3/trackors', {})).rejects.toThrow(ValidationError);
    });

    it('should throw RateLimitError for 429', async () => {
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      const headers = new Headers();
      headers.set('Retry-After', '60');

      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
        headers,
      });

      await expect(noRetryClient.get('v3/trackors')).rejects.toThrow(RateLimitError);
    });

    it('should throw ServerError for 500', async () => {
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
        headers: new Headers(),
      });

      await expect(noRetryClient.get('v3/trackors')).rejects.toThrow(ServerError);
    });

    it('should throw NetworkError on fetch failure', async () => {
      const noRetryClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        retry: { maxRetries: 0 },
      });

      fetchMock.mockRejectedValue(new Error('Network failure'));

      await expect(noRetryClient.get('v3/trackors')).rejects.toThrow(NetworkError);
    });
  });

  describe('Timeout', () => {
    it('should timeout after configured duration', async () => {
      const slowClient = new HttpClient({
        baseUrl: 'https://test.onevizion.com',
        auth: new TokenAuth('test-token'),
        timeout: 100,
        retry: { maxRetries: 0 },
      });

      // Simulate fetch respecting AbortSignal
      fetchMock.mockImplementation(
        (request: Request) =>
          new Promise((resolve, reject) => {
            const signal = request.signal;
            const timeoutId = setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 200);

            signal?.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }),
      );

      await expect(slowClient.get('v3/trackors')).rejects.toThrow(NetworkError);
      await expect(slowClient.get('v3/trackors')).rejects.toThrow('Request timeout');
    }, 300);
  });
});
