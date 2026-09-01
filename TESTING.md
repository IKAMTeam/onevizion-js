# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test file
npm test widget-auth.test.ts
```

## Testing Widget Authentication

### Unit Tests

The widget auth tests (`tests/widget-auth.test.ts`) cover:
- CSRF token extraction from parent iframe
- Token exchange via `/widget/GenerateApiTokenForWebSession`
- Token caching and expiration
- Error handling

### Manual Testing in OneVizion

To test widget authentication in a real OneVizion environment:

#### 1. Create a Test Widget HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OneVizion Widget Test</title>
  <script type="importmap">
  {
    "imports": {
      "@onevizion/sdk": "./path/to/your/built/sdk.js"
    }
  }
  </script>
</head>
<body>
  <div id="app">
    <h2>Widget Auth Test</h2>
    <button id="test-auth">Test Authentication</button>
    <button id="test-api">Fetch Trackors</button>
    <pre id="output"></pre>
  </div>

  <script type="module">
    import { OneVizionClient, widgetAuth } from '@onevizion/sdk';

    const output = document.getElementById('output');
    
    // Initialize client with widget auth
    const client = new OneVizionClient({
      baseUrl: window.location.origin,
      auth: widgetAuth({ baseUrl: window.location.origin })
    });

    document.getElementById('test-auth').addEventListener('click', async () => {
      try {
        const isAuth = await client.auth.isAuthenticated();
        output.textContent = `Authenticated: ${isAuth}`;
        
        if (isAuth) {
          const token = await client.auth.getToken();
          output.textContent += `\nToken: ${token.substring(0, 20)}...`;
        }
      } catch (error) {
        output.textContent = `Error: ${error.message}`;
        console.error(error);
      }
    });

    document.getElementById('test-api').addEventListener('click', async () => {
      try {
        const trackors = await client.trackors.list({ perPage: 5 });
        output.textContent = JSON.stringify(trackors, null, 2);
      } catch (error) {
        output.textContent = `Error: ${error.message}`;
        console.error(error);
      }
    });
  </script>
</body>
</html>
```

#### 2. Upload to OneVizion

1. Go to **Admin** → **Widgets**
2. Create a new widget
3. Upload your HTML file
4. Configure sandbox attributes:
   - ✅ `allow-same-origin` (required for CSRF access)
   - ✅ `allow-scripts` (required for JavaScript)

#### 3. Test the Widget

1. Add the widget to a dashboard or page
2. Open browser DevTools console
3. Click "Test Authentication" - should show authenticated status
4. Click "Fetch Trackors" - should display trackor data

#### 4. Verify CSRF Token Flow

In DevTools Network tab:
1. Look for POST to `/widget/GenerateApiTokenForWebSession`
2. Verify request headers include:
   - `X-CSRF-TOKEN: <token-from-parent>`
   - `Content-Type: application/x-www-form-urlencoded`
3. Verify response contains `{ "token": "..." }`

## Testing React Hooks

### Unit Tests

The React hook tests (`tests/react-hooks.test.tsx`) cover:
- Context provider and client access
- Query hooks (useTrackor, useTrackors, useWorkflows)
- Mutation hooks (useCreateTrackor, useUpdateTrackor, etc.)
- Integration with TanStack Query

### Testing in a React Widget

Create a React widget using the SDK:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  OneVizionClient, 
  OneVizionProvider,
  useTrackors,
  widgetAuth 
} from '@onevizion/sdk/react';

// Create client with widget auth
const client = new OneVizionClient({
  baseUrl: window.location.origin,
  auth: widgetAuth({ baseUrl: window.location.origin })
});

const queryClient = new QueryClient();

function TrackorsList() {
  const { data: trackors, isLoading, error } = useTrackors({
    filters: { perPage: 10 }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Trackors ({trackors?.length || 0})</h3>
      <ul>
        {trackors?.map(t => (
          <li key={t.id}>#{t.id} - {t.trackorType}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OneVizionProvider client={client}>
        <TrackorsList />
      </OneVizionProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

## Common Test Scenarios

### Testing Authentication Flow

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OneVizionClient } from '@onevizion/sdk';
import { WidgetAuth } from '@onevizion/sdk';

describe('Widget Authentication Flow', () => {
  it('should authenticate and make API calls', async () => {
    // Mock parent iframe
    window.top.document.querySelector = vi.fn().mockReturnValue({
      getAttribute: () => 'csrf-token'
    });

    // Mock API responses
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ // Token exchange
        ok: true,
        json: async () => ({ token: 'bearer-token' })
      })
      .mockResolvedValueOnce({ // API call
        ok: true,
        json: async () => [{ id: 1, trackorType: 'Asset' }]
      });

    const client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new WidgetAuth({ baseUrl: 'https://test.com' })
    });

    const trackors = await client.trackors.list();
    expect(trackors).toHaveLength(1);
  });
});
```

### Testing Token Expiration

```typescript
it('should refresh expired token', async () => {
  const auth = new WidgetAuth({
    baseUrl: 'https://test.com',
    tokenCacheDuration: 100 // 100ms for testing
  });

  // First call
  await auth.getToken();
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Should fetch new token
  await auth.getToken();
  
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
```

## Debugging Widget Issues

### Common Issues

1. **"CSRF token not found"**
   - Verify widget is in an iframe
   - Check sandbox attributes include `allow-same-origin`
   - Verify parent page has `<meta name="_csrf" content="...">`

2. **"Failed to generate API token"**
   - Check network tab for 401/403 errors
   - Verify CSRF token is being sent in headers
   - Confirm user has proper permissions

3. **"Network error while fetching API token"**
   - Check CORS settings
   - Verify endpoint is accessible
   - Check browser console for errors

### Debug Mode

Enable debug logging:

```javascript
const client = new OneVizionClient({
  baseUrl: window.location.origin,
  auth: widgetAuth({ baseUrl: window.location.origin }),
  // Add custom hooks for debugging
  hooks: {
    beforeRequest: [(request) => {
      console.log('Request:', request);
    }],
    afterResponse: [(response) => {
      console.log('Response:', response);
    }]
  }
});
```

## Browser Console Testing

Quick tests you can run in the browser console:

```javascript
// Test CSRF token access
console.log(window.top.document.querySelector('meta[name="_csrf"]')?.getAttribute('content'));

// Test iframe detection
console.log('In iframe:', window.self !== window.top);

// Manual token exchange
fetch('/widget/GenerateApiTokenForWebSession', {
  method: 'POST',
  headers: {
    'X-CSRF-TOKEN': window.top.document.querySelector('meta[name="_csrf"]').getAttribute('content'),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## CI/CD Testing

Tests run automatically in CI via Vitest. The widget auth tests mock the browser environment, so they work in Node.js/headless environments.

### Coverage Requirements

Current test coverage should include:
- ✅ Auth providers (Token, Credentials, Widget)
- ✅ Error classes
- ✅ Retry utilities
- ✅ React hooks
- ⏳ HTTP client (TODO)
- ⏳ Core API methods (TODO)
