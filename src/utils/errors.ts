/**
 * Base error class for all OneVizion SDK errors
 */
export class OneVizionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
    public readonly request?: unknown,
  ) {
    super(message);
    this.name = 'OneVizionError';
    Object.setPrototypeOf(this, OneVizionError.prototype);
  }
}

/**
 * Authentication error (401, 403)
 */
export class AuthenticationError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Validation error (400, 422)
 */
export class ValidationError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network error (connection, timeout)
 */
export class NetworkError extends OneVizionError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    if (originalError !== undefined) {
      this.originalError = originalError;
    }
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends OneVizionError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, response?: unknown, request?: unknown) {
    super(message, 429, response, request);
    this.name = 'RateLimitError';
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends OneVizionError {
  constructor(message: string, response?: unknown, request?: unknown) {
    super(message, 404, response, request);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Server error (500-level)
 */
export class ServerError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Check if error is retryable based on status code or error type
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof OneVizionError)) {
    return false;
  }

  // Network errors are retryable
  if (error instanceof NetworkError) {
    return true;
  }

  // Retry on these status codes
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return error.statusCode !== undefined && retryableStatusCodes.includes(error.statusCode);
}
