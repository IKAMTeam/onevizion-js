import { type UseQueryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { Trackor, TrackorFilters, TrackorTypeTreeNode } from '../core/trackors.js';
import type { Workflow, WorkflowExecution, WorkflowFilters } from '../core/workflows.js';
import { useOneVizionClient } from './context.js';
import { queryKeys } from './query-keys.js';

// Trackors

export interface UseTrackorOptions extends Omit<UseQueryOptions<Trackor>, 'queryKey' | 'queryFn'> {
  fields?: string[];
}

/**
 * Hook to fetch a single trackor by ID
 */
export function useTrackor(id: number, options?: UseTrackorOptions): UseQueryResult<Trackor> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.trackors.detail(id, options?.fields),
    queryFn: () => client.trackors.get(id, options?.fields),
    ...options,
  });
}

export interface UseTrackorsOptions
  extends Omit<UseQueryOptions<Trackor[]>, 'queryKey' | 'queryFn'> {
  filters?: TrackorFilters;
}

/**
 * Hook to fetch a list of trackors
 */
export function useTrackors(options?: UseTrackorsOptions): UseQueryResult<Trackor[]> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.trackors.list(options?.filters),
    queryFn: () => client.trackors.list(options?.filters),
    ...options,
  });
}

export interface UseTrackorSearchOptions
  extends Omit<UseQueryOptions<Trackor[]>, 'queryKey' | 'queryFn'> {
  view?: string;
  fields?: string[];
  page?: number;
  perPage?: number;
}

/**
 * Hook to search trackors using query builder
 *
 * @example
 * ```tsx
 * import { search } from '@onevizion/sdk';
 *
 * function MyComponent() {
 *   const query = search().equal('STATUS', 'Active').and().greater('QUANTITY', 10);
 *   const { data } = useTrackorSearch('ASSET', query);
 * }
 * ```
 */
export function useTrackorSearch(
  trackorType: string,
  searchQuery: string | { toString(): string },
  options?: UseTrackorSearchOptions,
): UseQueryResult<Trackor[]> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.trackors.search(trackorType, searchQuery.toString(), options),
    queryFn: () => client.trackors.search(trackorType, searchQuery, options),
    ...options,
  });
}

export type UseTrackorTreeOptions = Omit<
  UseQueryOptions<TrackorTypeTreeNode>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook to fetch the trackor type tree
 *
 * @example
 * ```tsx
 * function TrackorTypeSelector() {
 *   const { data: tree, isLoading } = useTrackorTree();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <TreeView data={tree} />;
 * }
 * ```
 */
export function useTrackorTree(
  options?: UseTrackorTreeOptions,
): UseQueryResult<TrackorTypeTreeNode> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.trackors.tree(),
    queryFn: () => client.trackors.getTree(),
    staleTime: 1000 * 60 * 5, // Tree doesn't change often, cache 5 mins
    ...options,
  });
}

// Workflows

export type UseWorkflowOptions = Omit<UseQueryOptions<Workflow>, 'queryKey' | 'queryFn'>;

/**
 * Hook to fetch a single workflow by ID
 */
export function useWorkflow(id: number, options?: UseWorkflowOptions): UseQueryResult<Workflow> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: () => client.workflows.get(id),
    ...options,
  });
}

export interface UseWorkflowsOptions
  extends Omit<UseQueryOptions<Workflow[]>, 'queryKey' | 'queryFn'> {
  filters?: WorkflowFilters;
}

/**
 * Hook to fetch a list of workflows
 */
export function useWorkflows(options?: UseWorkflowsOptions): UseQueryResult<Workflow[]> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.workflows.list(options?.filters),
    queryFn: () => client.workflows.list(options?.filters),
    ...options,
  });
}

export type UseWorkflowExecutionOptions = Omit<
  UseQueryOptions<WorkflowExecution>,
  'queryKey' | 'queryFn'
>;

/**
 * Hook to fetch a workflow execution by ID
 */
export function useWorkflowExecution(
  executionId: number,
  options?: UseWorkflowExecutionOptions,
): UseQueryResult<WorkflowExecution> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.workflows.execution(executionId),
    queryFn: () => client.workflows.getExecution(executionId),
    ...options,
  });
}

export interface UseWorkflowExecutionsOptions
  extends Omit<UseQueryOptions<WorkflowExecution[]>, 'queryKey' | 'queryFn'> {
  filters?: { page?: number; perPage?: number };
}

/**
 * Hook to fetch workflow executions for a workflow
 */
export function useWorkflowExecutions(
  workflowId: number,
  options?: UseWorkflowExecutionsOptions,
): UseQueryResult<WorkflowExecution[]> {
  const client = useOneVizionClient();

  return useQuery({
    queryKey: queryKeys.workflows.executions(workflowId),
    queryFn: () => client.workflows.listExecutions(workflowId, options?.filters),
    ...options,
  });
}
