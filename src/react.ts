/**
 * @onevizion/sdk/react - React hooks for OneVizion SDK
 *
 * @packageDocumentation
 */

// Re-export everything from main SDK
export * from './index.js';

// React-specific exports
export { OneVizionProvider, useOneVizionClient } from './react/context.js';
export { queryKeys } from './react/query-keys.js';

// Query hooks
export {
  useTrackor,
  useTrackors,
  useWorkflow,
  useWorkflows,
  useWorkflowExecution,
  useWorkflowExecutions,
  type UseTrackorOptions,
  type UseTrackorsOptions,
  type UseWorkflowOptions,
  type UseWorkflowsOptions,
  type UseWorkflowExecutionOptions,
  type UseWorkflowExecutionsOptions,
} from './react/queries.js';

// Mutation hooks
export {
  useCreateTrackor,
  useUpdateTrackor,
  useDeleteTrackor,
  useBatchUpdateTrackors,
  useExecuteWorkflow,
  type UseCreateTrackorOptions,
  type UseUpdateTrackorOptions,
  type UseDeleteTrackorOptions,
  type UseBatchUpdateTrackorsOptions,
  type UseExecuteWorkflowOptions,
  type UpdateTrackorVariables,
  type BatchUpdateTrackorsVariables,
  type ExecuteWorkflowVariables,
} from './react/mutations.js';
