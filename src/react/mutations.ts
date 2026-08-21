import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateTrackorData, Trackor, UpdateTrackorData } from '../core/trackors.js';
import type { ExecuteWorkflowData, WorkflowExecution } from '../core/workflows.js';
import { useOneVizionClient } from './context.js';
import { queryKeys } from './query-keys.js';

// Trackors

export type UseCreateTrackorOptions = Omit<
  UseMutationOptions<Trackor, Error, CreateTrackorData>,
  'mutationFn'
>;

/**
 * Hook to create a new trackor
 */
export function useCreateTrackor(
  options?: UseCreateTrackorOptions,
): UseMutationResult<Trackor, Error, CreateTrackorData> {
  const client = useOneVizionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => client.trackors.create(data),
    onSuccess: async (...args) => {
      // Wait for invalidation before calling user callback (prevents race condition)
      await queryClient.invalidateQueries({ queryKey: queryKeys.trackors.lists() });
      await options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export interface UpdateTrackorVariables {
  id: number;
  data: UpdateTrackorData;
}

export type UseUpdateTrackorOptions = Omit<
  UseMutationOptions<Trackor, Error, UpdateTrackorVariables>,
  'mutationFn'
>;

/**
 * Hook to update a trackor
 */
export function useUpdateTrackor(
  options?: UseUpdateTrackorOptions,
): UseMutationResult<Trackor, Error, UpdateTrackorVariables> {
  const client = useOneVizionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => client.trackors.update(id, data),
    onSuccess: async (...args) => {
      // Wait for all invalidations before calling user callback
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trackors.detail(args[1].id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trackors.lists() }),
      ]);
      await options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export type UseDeleteTrackorOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

/**
 * Hook to delete a trackor
 */
export function useDeleteTrackor(
  options?: UseDeleteTrackorOptions,
): UseMutationResult<void, Error, number> {
  const client = useOneVizionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => client.trackors.delete(id),
    onSuccess: async (...args) => {
      // Wait for all invalidations
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trackors.detail(args[1]) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trackors.lists() }),
      ]);
      await options?.onSuccess?.(...args);
    },
    ...options,
  });
}

export interface BatchUpdateTrackorsVariables {
  updates: Array<{ id: number; fields: Record<string, unknown> }>;
}

export type UseBatchUpdateTrackorsOptions = Omit<
  UseMutationOptions<Trackor[], Error, BatchUpdateTrackorsVariables>,
  'mutationFn'
>;

/**
 * Hook to batch update trackors
 */
export function useBatchUpdateTrackors(
  options?: UseBatchUpdateTrackorsOptions,
): UseMutationResult<Trackor[], Error, BatchUpdateTrackorsVariables> {
  const client = useOneVizionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updates }) => client.trackors.batchUpdate(updates),
    onSuccess: async (...args) => {
      // Invalidate all affected trackors and lists
      const invalidations = args[1].updates.map((update) =>
        queryClient.invalidateQueries({ queryKey: queryKeys.trackors.detail(update.id) }),
      );
      invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.trackors.lists() }));

      await Promise.all(invalidations);
      await options?.onSuccess?.(...args);
    },
    ...options,
  });
}

// Workflows

export interface ExecuteWorkflowVariables {
  workflowId: number;
  data: ExecuteWorkflowData;
}

export type UseExecuteWorkflowOptions = Omit<
  UseMutationOptions<WorkflowExecution, Error, ExecuteWorkflowVariables>,
  'mutationFn'
>;

/**
 * Hook to execute a workflow
 */
export function useExecuteWorkflow(
  options?: UseExecuteWorkflowOptions,
): UseMutationResult<WorkflowExecution, Error, ExecuteWorkflowVariables> {
  const client = useOneVizionClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, data }) => client.workflows.execute(workflowId, data),
    onSuccess: async (...args) => {
      // Wait for invalidation
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.executions(args[1].workflowId),
      });
      await options?.onSuccess?.(...args);
    },
    ...options,
  });
}
