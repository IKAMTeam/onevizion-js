/**
 * @onevizion/sdk - TypeScript SDK for the OneVizion API
 *
 * Pragmatic, functional TypeScript SDK with:
 * - Immutable, readonly types
 * - Pure functions (no hidden mutations)
 * - Type-safe generics and branded types
 * - Discriminated unions for state
 * - Promise-based (works with TanStack Query, SWR, etc.)
 * - Tree-shakeable, minimal bundle size
 *
 * @packageDocumentation
 */

// Main client
export { OneVizionClient } from './client.js';

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

// Core resources
export { TrackorsClient, WorkflowsClient } from './core/index.js';

export type {
  Trackor,
  TrackorFilters,
  CreateTrackorData,
  UpdateTrackorData,
  Workflow,
  WorkflowFilters,
  ExecuteWorkflowData,
  WorkflowExecution,
} from './core/index.js';

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

// Query builder
export { search, SearchQuery } from './utils/query-builder.js';
