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
 * Authentication-related errors
 */
export class AuthenticationError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Validation errors (400-level errors)
 */
export class ValidationError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network-related errors (connectivity issues, timeouts)
 */
export class NetworkError extends OneVizionError {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends OneVizionError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    response?: unknown,
    request?: unknown,
  ) {
    super(message, 429, response, request);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends OneVizionError {
  constructor(message: string, response?: unknown, request?: unknown) {
    super(message, 404, response, request);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Server errors (500-level errors)
 */
export class ServerError extends OneVizionError {
  constructor(message: string, statusCode?: number, response?: unknown, request?: unknown) {
    super(message, statusCode, response, request);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
