export type * from './openapi.js';

/**
 * Common types used throughout the SDK
 */

export interface OneVizionConfig {
  /** Base URL for the OneVizion API (e.g., 'https://app.onevizion.com') */
  baseUrl: string;
  /** Authentication provider */
  auth: AuthProvider;
  /** Optional request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Optional retry configuration */
  retry?: RetryConfig;
  /** Optional request interceptors */
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum retry delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Exponential backoff factor (default: 2) */
  backoffFactor?: number;
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatusCodes?: number[];
}

export interface AuthProvider {
  /** Get the current authentication token */
  getToken(): Promise<string | null>;
  /** Refresh the authentication token if expired */
  refreshToken?(): Promise<string>;
  /** Check if authentication is valid */
  isAuthenticated(): Promise<boolean>;
}

export type RequestInterceptor = (request: Request) => Promise<Request> | Request;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  perPage?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
