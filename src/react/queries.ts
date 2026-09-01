/**
 * TanStack Query hooks for OneVizion API
 *
 * @example
 * ```typescript
 * import { useOneVizionQuery } from '@onevizion/sdk/react';
 *
 * function MyComponent() {
 *   const { data, isLoading } = useOneVizionQuery(
 *     ['trackor', 123],
 *     (client) => client.comOnevizionWebControllerApiV3TrackorByTidJsonApiControllerV3_get({
 *       path: { trackor_id: 123 }
 *     })
 *   );
 * }
 * ```
 */

import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import type { Client } from '../generated/client/types.gen.js';
import { useOneVizionClient } from './context.js';

/**
 * Generic query hook for OneVizion API
 *
 * Use this hook to call any generated API function with TanStack Query support
 */
export function useOneVizionQuery<TData = unknown>(
  queryKey: QueryKey,
  fn: (client: Client) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData, Error> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey,
    queryFn: () => fn(client.getClient()),
    ...options,
  });
}
