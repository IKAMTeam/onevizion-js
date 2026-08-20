import ky, { type KyInstance, type Options as KyOptions } from 'ky';
import type { AuthProvider, OneVizionConfig } from '../types/index.js';
import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  OneVizionError,
  RateLimitError,
  ServerError,
  ValidationError,
} from './errors.js';
import { mergeRetryConfig, withRetry } from './retry.js';

export class HttpClient {
  private readonly ky: KyInstance;
  private readonly auth: AuthProvider;
  private readonly retryConfig: ReturnType<typeof mergeRetryConfig>;

  constructor(config: OneVizionConfig) {
    this.auth = config.auth;
    this.retryConfig = mergeRetryConfig(config.retry);

    const kyOptions: KyOptions = {
      prefixUrl: `${config.baseUrl}/api`,
      timeout: config.timeout ?? 30000,
      retry: 0, // We handle retries manually for more control
      hooks: {
        beforeRequest: [
          async (request) => {
            // Add authentication header
            const token = await this.auth.getToken();
            if (token) {
              request.headers.set('Authorization', `Bearer ${token}`);
            }

            // Apply custom request interceptors
            let modifiedRequest = request;
            if (config.interceptors?.request) {
              for (const interceptor of config.interceptors.request) {
                modifiedRequest = await interceptor(modifiedRequest);
              }
            }
            return modifiedRequest;
          },
        ],
        beforeError: [
          async (error) => {
            const { response } = error;

            if (!response) {
              throw new NetworkError('Network error: no response received', error);
            }

            // Try to parse error response
            let errorData: unknown;
            try {
              errorData = await response.json();
            } catch {
              errorData = await response.text();
            }

            // Create appropriate error type based on status code
            const status = response.status;

            if (status === 401 || status === 403) {
              throw new AuthenticationError(
                `Authentication failed: ${response.statusText}`,
                status,
                errorData,
                error.request,
              );
            }

            if (status === 404) {
              throw new NotFoundError(
                `Resource not found: ${response.statusText}`,
                errorData,
                error.request,
              );
            }

            if (status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              throw new RateLimitError(
                'Rate limit exceeded',
                retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
                errorData,
                error.request,
              );
            }

            if (status >= 400 && status < 500) {
              throw new ValidationError(
                `Validation error: ${response.statusText}`,
                status,
                errorData,
                error.request,
              );
            }

            if (status >= 500) {
              throw new ServerError(
                `Server error: ${response.statusText}`,
                status,
                errorData,
                error.request,
              );
            }

            throw new OneVizionError(error.message, status, errorData, error.request);
          },
        ],
        afterResponse: [
          async (_request, _options, response) => {
            // Apply custom response interceptors
            let modifiedResponse = response;
            if (config.interceptors?.response) {
              for (const interceptor of config.interceptors.response) {
                modifiedResponse = await interceptor(modifiedResponse);
              }
            }
            return modifiedResponse;
          },
        ],
      },
    };

    this.ky = ky.create(kyOptions);
  }

  async get<T>(url: string, options?: KyOptions): Promise<T> {
    return withRetry(async () => this.ky.get(url, options).json<T>(), this.retryConfig);
  }

  async post<T>(url: string, data?: unknown, options?: KyOptions): Promise<T> {
    return withRetry(
      async () => this.ky.post(url, { ...options, json: data }).json<T>(),
      this.retryConfig,
    );
  }

  async put<T>(url: string, data?: unknown, options?: KyOptions): Promise<T> {
    return withRetry(
      async () => this.ky.put(url, { ...options, json: data }).json<T>(),
      this.retryConfig,
    );
  }

  async patch<T>(url: string, data?: unknown, options?: KyOptions): Promise<T> {
    return withRetry(
      async () => this.ky.patch(url, { ...options, json: data }).json<T>(),
      this.retryConfig,
    );
  }

  async delete<T>(url: string, options?: KyOptions): Promise<T> {
    return withRetry(async () => this.ky.delete(url, options).json<T>(), this.retryConfig);
  }

  /**
   * Get the underlying ky instance for advanced usage
   */
  getKyInstance(): KyInstance {
    return this.ky;
  }
}
