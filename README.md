# @onevizion/sdk

TypeScript SDK for the OneVizion API with React hooks for TanStack Query integration.

## Features

- ✅ **Type-safe** - Auto-generated TypeScript types from OpenAPI specification
- ✅ **Elegant API** - Handwritten client wrapper with ergonomic methods
- ✅ **React hooks** - First-class React support via TanStack Query
- ✅ **Widget authentication** - Built-in support for OneVizion's widget iframe flow
- ✅ **Automatic retries** - Configurable retry logic with exponential backoff
- ✅ **Error handling** - Structured error types for different failure scenarios
- ✅ **Tree-shakeable** - Modern ESM build with optimal bundle size

## Installation

```bash
npm install @onevizion/sdk

# For React support, also install peer dependencies:
npm install react @tanstack/react-query
```

## Quick Start

### Basic Usage (Node.js)

```typescript
import { OneVizionClient, tokenAuth } from '@onevizion/sdk';

const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: tokenAuth('your-api-token'),
});

// Get a trackor
const trackor = await client.trackors.get(123);

// List trackors with filters
const trackors = await client.trackors.list({
  trackorType: 'Asset',
  status: 'Active',
  perPage: 10,
});

// Create a new trackor
const newTrackor = await client.trackors.create({
  trackorType: 'Asset',
  fields: {
    name: 'New Asset',
    status: 'Active',
  },
});

// Update a trackor
await client.trackors.update(123, {
  fields: { status: 'Inactive' },
});

// Execute a workflow
const execution = await client.workflows.execute(1, {
  trackorId: 123,
});
```

### React Hooks

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  OneVizionClient,
  OneVizionProvider,
  useTrackor,
  useUpdateTrackor,
  widgetAuth,
} from '@onevizion/sdk/react';

// Create client
const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: widgetAuth({ baseUrl: 'https://app.onevizion.com' }),
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OneVizionProvider client={client}>
        <TrackorDetail id={123} />
      </OneVizionProvider>
    </QueryClientProvider>
  );
}

function TrackorDetail({ id }: { id: number }) {
  const { data, isLoading } = useTrackor(id);
  const updateMutation = useUpdateTrackor();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Trackor #{data.id}</h1>
      <button
        onClick={() =>
          updateMutation.mutate({
            id,
            data: { fields: { status: 'Complete' } },
          })
        }
      >
        Mark Complete
      </button>
    </div>
  );
}
```

## Authentication

The SDK supports three authentication methods:

### 1. Widget Authentication (Production)

For embedded iframe widgets. Automatically extracts CSRF token from parent window.

```typescript
import { OneVizionClient, widgetAuth } from '@onevizion/sdk';

const client = new OneVizionClient({
  baseUrl: window.location.origin,
  auth: widgetAuth({
    baseUrl: window.location.origin,
    tokenCacheDuration: 3600000, // 1 hour (default)
  }),
});
```

**Requirements:**
- Must be running in an iframe
- Parent page must have `<meta name="_csrf" content="...">` tag
- Iframe must have `allow-same-origin` and `allow-scripts` sandbox attributes

### 2. Token Authentication (Recommended)

For direct API token usage.

```typescript
import { OneVizionClient, tokenAuth } from '@onevizion/sdk';

const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: tokenAuth('your-api-token-here'),
});
```

### 3. Credentials Authentication (Development Only)

Username/password authentication. **Not recommended for production.**

```typescript
import { OneVizionClient, credentialsAuth } from '@onevizion/sdk';

const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: credentialsAuth({
    baseUrl: 'https://app.onevizion.com',
    username: 'your-username',
    password: 'your-password',
  }),
});
```

## API Reference

### Core SDK

#### `OneVizionClient`

Main API client with resource clients attached.

```typescript
const client = new OneVizionClient(config);

// Resource clients
client.trackors
client.workflows
```

#### Configuration Options

```typescript
interface OneVizionConfig {
  baseUrl: string;
  auth: AuthProvider;
  timeout?: number; // default: 30000ms
  retry?: RetryConfig;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
  };
}

interface RetryConfig {
  maxRetries?: number; // default: 3
  initialDelay?: number; // default: 1000ms
  maxDelay?: number; // default: 10000ms
  backoffFactor?: number; // default: 2
  retryableStatusCodes?: number[]; // default: [408, 429, 500, 502, 503, 504]
}
```

### Trackors API

```typescript
// Get a trackor
await client.trackors.get(id, fields?);

// List trackors
await client.trackors.list(filters?);

// Create a trackor
await client.trackors.create({ trackorType, fields });

// Update a trackor
await client.trackors.update(id, { fields });

// Delete a trackor
await client.trackors.delete(id);

// Batch update
await client.trackors.batchUpdate([
  { id: 1, fields: { status: 'Active' } },
  { id: 2, fields: { status: 'Inactive' } },
]);
```

### Workflows API

```typescript
// Get a workflow
await client.workflows.get(id);

// List workflows
await client.workflows.list(filters?);

// Execute a workflow
await client.workflows.execute(workflowId, { trackorId, parameters? });

// Get execution status
await client.workflows.getExecution(executionId);

// List executions
await client.workflows.listExecutions(workflowId, filters?);
```

### React Hooks

#### Query Hooks

```typescript
// Trackors
useTrackor(id, options?)
useTrackors(options?)

// Workflows
useWorkflow(id, options?)
useWorkflows(options?)
useWorkflowExecution(executionId, options?)
useWorkflowExecutions(workflowId, options?)
```

#### Mutation Hooks

```typescript
// Trackors
useCreateTrackor(options?)
useUpdateTrackor(options?)
useDeleteTrackor(options?)
useBatchUpdateTrackors(options?)

// Workflows
useExecuteWorkflow(options?)
```

All hooks support standard TanStack Query options and return TanStack Query result objects.

## Error Handling

The SDK provides structured error types:

```typescript
import {
  OneVizionError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  RateLimitError,
  NotFoundError,
  ServerError,
} from '@onevizion/sdk';

try {
  await client.trackors.get(123);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle auth failure (401, 403)
  } else if (error instanceof NotFoundError) {
    // Handle 404
  } else if (error instanceof RateLimitError) {
    // Handle 429 - error.retryAfter contains seconds to wait
  } else if (error instanceof ValidationError) {
    // Handle 400-level errors
  } else if (error instanceof ServerError) {
    // Handle 500-level errors
  } else if (error instanceof NetworkError) {
    // Handle network/connectivity issues
  }
}
```

## Advanced Usage

### Custom Retry Configuration

```typescript
const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: tokenAuth('token'),
  retry: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 3,
    retryableStatusCodes: [429, 503],
  },
});
```

### Request/Response Interceptors

```typescript
const client = new OneVizionClient({
  baseUrl: 'https://app.onevizion.com',
  auth: tokenAuth('token'),
  interceptors: {
    request: [
      async (request) => {
        // Log all requests
        console.log('Request:', request.url);
        return request;
      },
    ],
    response: [
      async (response) => {
        // Log all responses
        console.log('Response:', response.status);
        return response;
      },
    ],
  },
});
```

### Custom Query Keys

```typescript
import { queryKeys } from '@onevizion/sdk/react';

// Use the same query keys for manual cache operations
queryClient.invalidateQueries({ queryKey: queryKeys.trackors.lists() });
queryClient.setQueryData(queryKeys.trackors.detail(123), updatedTrackor);
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic usage](./examples/basic-usage.ts) - Node.js script
- [Widget authentication](./examples/widget-auth.html) - Iframe widget
- [React app](./examples/react-app.tsx) - React component with hooks

## Development

```bash
# Install dependencies
npm install

# Generate TypeScript types from OpenAPI
npm run generate:types

# Run tests
npm test

# Type check
npm run type-check

# Lint and format
npm run lint
npm run format

# Build
npm run build

# Check bundle size
npm run size
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/onevizion/onevizion-javascript/issues
- OneVizion Documentation: https://www.onevizion.com/documentation

---

Built with ❤️ using TypeScript, TanStack Query, and modern build tools.
