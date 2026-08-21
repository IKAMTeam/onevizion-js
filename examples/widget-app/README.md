# OneVizion Widget Example

React widget app that demonstrates the OneVizion SDK in a real widget context.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Build for Production

```bash
pnpm build
```

Output: `dist/index.html` (bundled with all dependencies)

## Testing in OneVizion

### Option 1: Widget Auth (CSRF squeeze)

1. Build the widget:
   ```bash
   pnpm build
   ```

2. Serve it:
   ```bash
   npx serve dist -p 3000
   ```

3. Create tunnel:
   ```bash
   ngrok http 3000
   ```

4. In OneVizion, create widget with:
   - URL: `https://your-ngrok-url.ngrok-free.app`
   - Sandbox: `allow-same-origin allow-scripts`

5. Widget will auto-authenticate using parent CSRF token

### Option 2: Token Auth (manual API token)

For testing without widget context:

```javascript
import { OneVizionClient, tokenAuth } from '@onevizion/sdk';

const client = new OneVizionClient({
  baseUrl: 'https://your-instance.onevizion.com',
  auth: tokenAuth('your-api-token-here')
});
```

Change `SearchBuilder.jsx` to use `tokenAuth` instead of `widgetAuth`.

## What It Does

- Visual query builder for OneVizion trackors
- Builds search expressions using the SDK query builder
- Executes searches against real OneVizion API
- Displays results in a table
- Auto-authenticates when embedded as a widget
