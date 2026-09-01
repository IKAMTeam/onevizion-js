/**
 * @onevizion/sdk - TypeScript SDK for the OneVizion API
 *
 * Modern, type-safe TypeScript SDK with:
 * - Complete API coverage via code generation
 * - Type-safe requests and responses
 * - Multiple authentication methods (Widget, Token, Credentials)
 * - Retry logic and error handling
 * - Promise-based (works with TanStack Query, SWR, etc.)
 * - Tree-shakeable, minimal bundle size
 *
 * @packageDocumentation
 */

// Main client
export { OneVizionClient } from './sdk-client.js';

// Authentication
export {
  WidgetAuth,
  widgetAuth,
  TokenAuth,
  tokenAuth,
  CredentialsAuth,
  credentialsAuth,
} from './auth/index.js';

export type { WidgetAuthConfig, CredentialsAuthConfig } from './auth/index.js';

// Types
export type {
  OneVizionConfig,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
  PaginationParams,
  PaginatedResponse,
  AuthProvider,
  TrackorFieldValue,
} from './types/index.js';

// Error types
export {
  OneVizionError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  RateLimitError,
  NotFoundError,
  ServerError,
  isRetryable,
} from './utils/errors.js';

// Query builder (fluent search API)
export { search, type SearchQuery } from './utils/query-builder.js';

// Re-export generated types and client for direct access
export type { Client } from './generated/client/types.gen.js';
export type * from './generated/types.gen.js';
