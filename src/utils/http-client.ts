import type {
  AuthProvider,
  OneVizionConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/index.js';
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

/**
 * Lightweight HTTP client built on native fetch
 *
 * No external dependencies - just 2KB of pure fetch wrapper
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly auth: AuthProvider;
  private readonly timeout: number;
  private readonly retryConfig: ReturnType<typeof mergeRetryConfig>;
  private readonly requestInterceptors: RequestInterceptor[];
  private readonly responseInterceptors: ResponseInterceptor[];

  constructor(config: OneVizionConfig) {
    this.baseUrl = `${config.baseUrl}/api`;
    this.auth = config.auth;
    this.timeout = config.timeout ?? 30000;
    this.retryConfig = mergeRetryConfig(config.retry);
    this.requestInterceptors = config.interceptors?.request ?? [];
    this.responseInterceptors = config.interceptors?.response ?? [];
  }

  /**
   * Build full URL from relative path
   */
  private buildUrl(path: string): string {
    return `${this.baseUrl}/${path}`;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(request: Request): Promise<Request> {
    let modifiedRequest = request;
    for (const interceptor of this.requestInterceptors) {
      modifiedRequest = await interceptor(modifiedRequest);
    }
    return modifiedRequest;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Convert HTTP errors to typed OneVizionError
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    // Parse error response
    let errorData: unknown;
    const text = await response.text();

    if (text) {
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = text;
      }
    }

    const message =
      typeof errorData === 'string'
        ? errorData
        : ((errorData as { message?: string })?.message ?? response.statusText);

    // Map status codes to error types
    switch (response.status) {
      case 401:
      case 403:
        throw new AuthenticationError(message, response.status, errorData);

      case 404:
        throw new NotFoundError(message, response.status, errorData);

      case 400:
      case 422:
        throw new ValidationError(message, response.status, errorData);

      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
          errorData,
        );
      }

      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(message, response.status, errorData);

      default:
        throw new OneVizionError(message, response.status, errorData);
    }
  }

  /**
   * Core request method with auth, timeout, and interceptors
   */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Combine signals if user provided one
    const signal = options?.signal
      ? this.combineSignals(controller.signal, options.signal)
      : controller.signal;

    try {
      // Get auth token
      const token = await this.auth.getToken();

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

      if (token) {
        // @ts-expect-error - TypeScript exactOptionalPropertyTypes requires bracket notation
        headers.Authorization = `Bearer ${token}`;
      }

      // Create request
      let request = new Request(this.buildUrl(path), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : null,
        signal,
      });

      // Apply request interceptors
      request = await this.applyRequestInterceptors(request);

      // Make request
      let response = await fetch(request);

      clearTimeout(timeoutId);

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      // Handle errors
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse JSON response
      if (response.status === 204 || method === 'DELETE') {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw OneVizionError as-is
      if (error instanceof OneVizionError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }

      // Network errors
      throw new NetworkError(
        error instanceof Error ? error.message : 'Network request failed',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Combine multiple AbortSignals (helper for user-provided signals)
   */
  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();
    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);

    return controller.signal;
  }

  /**
   * GET request with retry
   */
  async get<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
    return withRetry(() => this.request<T>('GET', path, options), this.retryConfig);
  }

  /**
   * POST request with retry
   */
  async post<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return withRetry(() => this.request<T>('POST', path, { ...options, body }), this.retryConfig);
  }

  /**
   * PUT request with retry
   */
  async put<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return withRetry(() => this.request<T>('PUT', path, { ...options, body }), this.retryConfig);
  }

  /**
   * PATCH request with retry
   */
  async patch<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
    return withRetry(() => this.request<T>('PATCH', path, { ...options, body }), this.retryConfig);
  }

  /**
   * DELETE request with retry
   */
  async delete<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
    return withRetry(() => this.request<T>('DELETE', path, options), this.retryConfig);
  }
}
