/**
 * Query key helpers for TanStack Query
 *
 * @example
 * ```typescript
 * import { createQueryKey } from '@onevizion/sdk/react';
 *
 * const queryKey = createQueryKey('trackors', 'detail', 123);
 * // ['trackors', 'detail', 123]
 * ```
 */

import type { QueryKey } from '@tanstack/react-query';

/**
 * Create a type-safe query key
 */
export function createQueryKey(...parts: readonly (string | number | object | undefined)[]): QueryKey {
  return parts.filter((p) => p !== undefined) as QueryKey;
}
