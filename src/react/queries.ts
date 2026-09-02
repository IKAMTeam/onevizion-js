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

/**
 * Get single trackor by ID
 */
export function useTrackor(
  id: number,
  options?: { fields?: string[] } & Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useOneVizionClient();
  const fields = options?.fields;

  return useQuery({
    queryKey: ['trackor', id, fields],
    queryFn: () => client.trackors.get(id, fields),
    ...options,
  });
}

/**
 * Search trackors
 */
export function useTrackorSearch(
  trackorType: string,
  conditions: string,
  searchOptions?: { perPage?: number; page?: number; fields?: string[] },
  queryOptions?: Omit<UseQueryOptions<unknown[], Error>, 'queryKey' | 'queryFn'>,
) {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: ['trackors', 'search', trackorType, conditions, searchOptions],
    queryFn: () => client.trackors.search(trackorType, conditions, searchOptions),
    ...queryOptions,
  });
}

/**
 * Get trackor type tree
 */
export function useTrackorTree(options?: Omit<UseQueryOptions<unknown, Error>, 'queryKey' | 'queryFn'>) {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: ['trackors', 'tree'],
    queryFn: () => client.trackors.getTree(),
    ...options,
  });
}

/**
 * List trackors
 */
export function useTrackors(
  options?: {
    filters?: {
      trackorType?: string;
      status?: string;
      page?: number;
      perPage?: number;
      fields?: Record<string, unknown>;
    };
  } & Omit<UseQueryOptions<unknown[], Error>, 'queryKey' | 'queryFn'>
) {
  const client = useOneVizionClient();
  const filters = options?.filters;

  return useQuery({
    queryKey: ['trackors', 'list', filters],
    queryFn: () => client.trackors.list(filters || {}),
    ...options,
  });
}
