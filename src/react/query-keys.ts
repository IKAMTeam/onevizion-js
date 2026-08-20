import type { TrackorFilters } from '../core/trackors.js';
import type { WorkflowFilters } from '../core/workflows.js';

/**
 * Query key factory for TanStack Query
 *
 * This ensures consistent cache keys across the application
 */
export const queryKeys = {
  // Trackors
  trackors: {
    all: ['trackors'] as const,
    lists: () => [...queryKeys.trackors.all, 'list'] as const,
    list: (filters?: TrackorFilters) => [...queryKeys.trackors.lists(), filters] as const,
    details: () => [...queryKeys.trackors.all, 'detail'] as const,
    detail: (id: number, fields?: string[]) =>
      [...queryKeys.trackors.details(), id, fields] as const,
  },

  // Workflows
  workflows: {
    all: ['workflows'] as const,
    lists: () => [...queryKeys.workflows.all, 'list'] as const,
    list: (filters?: WorkflowFilters) => [...queryKeys.workflows.lists(), filters] as const,
    details: () => [...queryKeys.workflows.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.workflows.details(), id] as const,
    executions: (workflowId: number) =>
      [...queryKeys.workflows.all, 'executions', workflowId] as const,
    execution: (executionId: number) =>
      [...queryKeys.workflows.all, 'execution', executionId] as const,
  },
} as const;
