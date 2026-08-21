import type { HttpClient } from '../utils/http-client.js';

export interface WorkflowFilters {
  /** Filter by status */
  status?: 'active' | 'inactive' | 'completed';
  /** Filter by name */
  name?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  perPage?: number;
}

export interface Workflow {
  id: number;
  name: string;
  status: string;
  [key: string]: unknown;
}

export interface ExecuteWorkflowData {
  /** Trackor ID to execute workflow on */
  trackorId: number;
  /** Optional workflow parameters */
  parameters?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: number;
  workflowId: number;
  trackorId: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  [key: string]: unknown;
}

/**
 * Workflows API client
 */
export class WorkflowsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a workflow by ID
   */
  async get(id: number): Promise<Workflow> {
    return this.http.get<Workflow>(`v3/workflows/${id}`);
  }

  /**
   * List workflows with optional filters
   */
  async list(filters?: WorkflowFilters): Promise<Workflow[]> {
    const searchParams = new URLSearchParams();

    if (filters?.status) {
      searchParams.set('status', filters.status);
    }

    if (filters?.name) {
      searchParams.set('name', filters.name);
    }

    if (filters?.page) {
      searchParams.set('page', filters.page.toString());
    }

    if (filters?.perPage) {
      searchParams.set('perPage', filters.perPage.toString());
    }

    const url = searchParams.toString()
      ? `v3/workflows?${searchParams.toString()}`
      : 'v3/workflows';

    return this.http.get<Workflow[]>(url);
  }

  /**
   * Execute a workflow
   */
  async execute(workflowId: number, data: ExecuteWorkflowData): Promise<WorkflowExecution> {
    return this.http.post<WorkflowExecution>(`v3/workflows/${workflowId}/execute`, data);
  }

  /**
   * Get workflow execution status
   */
  async getExecution(executionId: number): Promise<WorkflowExecution> {
    return this.http.get<WorkflowExecution>(`v3/workflow-executions/${executionId}`);
  }

  /**
   * List workflow executions for a workflow
   */
  async listExecutions(
    workflowId: number,
    filters?: { page?: number; perPage?: number },
  ): Promise<WorkflowExecution[]> {
    const searchParams = new URLSearchParams();

    if (filters?.page) {
      searchParams.set('page', filters.page.toString());
    }

    if (filters?.perPage) {
      searchParams.set('perPage', filters.perPage.toString());
    }

    const url = searchParams.toString()
      ? `v3/workflows/${workflowId}/executions?${searchParams.toString()}`
      : `v3/workflows/${workflowId}/executions`;

    return this.http.get<WorkflowExecution[]>(url);
  }
}
