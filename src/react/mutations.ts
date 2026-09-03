/**
 * TanStack Query mutations for OneVizion API
 *
 * @example
 * ```typescript
 * import { useOneVizionMutation } from '@onevizion/sdk/react';
 *
 * function MyComponent() {
 *   const mutation = useOneVizionMutation();
 *
 *   const handleClick = () => {
 *     mutation.mutate({
 *       fn: (client) => client.comOnevizionWebControllerApiV3TrackorByTidJsonApiControllerV3_post({
 *         body: { ... }
 *       })
 *     });
 *   };
 * }
 * ```
 */

import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from '@tanstack/react-query';
import type { Client } from '../generated/client/types.gen.js';
import { useOneVizionClient } from './context.js';

export interface OneVizionMutationOptions<TData, TVariables> {
  fn: (client: Client, variables: TVariables) => Promise<TData>;
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;
}

/**
 * Generic mutation hook for OneVizion API
 *
 * Use this hook to call any generated API function with TanStack Query mutation support
 */
export function useOneVizionMutation<TData = unknown, TVariables = void>(
  fn: (client: Client, variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
): UseMutationResult<TData, Error, TVariables> {
  const client = useOneVizionClient();

  return useMutation({
    mutationFn: (variables) => fn(client.getClient(), variables),
    ...options,
  });
}

/**
 * Create trackor mutation
 */
export function useCreateTrackor(
  options?: Omit<
    UseMutationOptions<unknown, Error, { trackorType: string; fields: Record<string, unknown> }>,
    'mutationFn'
  >,
) {
  const client = useOneVizionClient();

  return useMutation({
    mutationFn: ({ trackorType, fields }) => client.trackors.create(trackorType, fields),
    ...options,
  });
}

/**
 * Update trackor mutation
 */
export function useUpdateTrackor(
  options?: Omit<
    UseMutationOptions<unknown, Error, { id: number; data: { fields: Record<string, unknown> } }>,
    'mutationFn'
  >,
) {
  const client = useOneVizionClient();

  return useMutation({
    mutationFn: ({ id, data }) => client.trackors.update(id, data.fields),
    ...options,
  });
}
