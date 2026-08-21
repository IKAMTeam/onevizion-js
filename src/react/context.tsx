import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { OneVizionClient } from '../client.js';

const OneVizionContext = createContext<OneVizionClient | null>(null);

export interface OneVizionProviderProps {
  client: OneVizionClient;
  children: ReactNode;
}

/**
 * Provider component for OneVizion SDK
 *
 * @example
 * ```tsx
 * import { OneVizionClient, OneVizionProvider, widgetAuth } from '@onevizion/sdk/react';
 *
 * const client = new OneVizionClient({
 *   baseUrl: 'https://app.onevizion.com',
 *   auth: widgetAuth({ baseUrl: 'https://app.onevizion.com' }),
 * });
 *
 * function App() {
 *   return (
 *     <OneVizionProvider client={client}>
 *       <YourApp />
 *     </OneVizionProvider>
 *   );
 * }
 * ```
 */
export function OneVizionProvider({ client, children }: OneVizionProviderProps): JSX.Element {
  // Memoize to prevent unnecessary re-renders when parent re-renders
  const value = useMemo(() => client, [client]);

  return <OneVizionContext.Provider value={value}>{children}</OneVizionContext.Provider>;
}

/**
 * Hook to access the OneVizion client from context
 */
export function useOneVizionClient(): OneVizionClient {
  const client = useContext(OneVizionContext);

  if (!client) {
    throw new Error('useOneVizionClient must be used within OneVizionProvider');
  }

  return client;
}
