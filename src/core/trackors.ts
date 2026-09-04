import type { HttpClient } from '../utils/http-client.js';

export interface Trackor {
  id: number;
  trackorType: string;
  fields: Record<string, unknown>;
}

export interface TrackorTreeNode {
  name: string;
  label: string;
  children?: TrackorTreeNode[];
}

export interface SearchOptions {
  perPage?: number;
  page?: number;
  fields?: string[];
}

export interface ListOptions {
  trackorType?: string;
  status?: string;
  page?: number;
  perPage?: number;
  fields?: Record<string, unknown>;
}

export interface CreateTrackorInput {
  trackorType: string;
  fields: Record<string, unknown>;
}

export interface UpdateTrackorInput {
  id: number;
  fields: Record<string, unknown>;
}

/**
 * Client for working with Trackors (OneVizion's configurable entities)
 */
export class TrackorsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a trackor by ID
   */
  async get(id: number, fields?: string[]): Promise<Trackor> {
    const params = new URLSearchParams();
    if (fields && fields.length > 0) {
      params.set('fields', fields.join(','));
    }

    const query = params.toString();
    const url = `v3/trackors/${id}${query ? `?${query}` : ''}`;

    return this.http.get<Trackor>(url);
  }

  /**
   * List trackors with filters
   */
  async list(options: ListOptions = {}): Promise<Trackor[]> {
    const params = new URLSearchParams();

    if (options.trackorType) {
      params.set('trackorType', options.trackorType);
    }
    if (options.status) {
      params.set('status', options.status);
    }
    if (options.page) {
      params.set('page', options.page.toString());
    }
    if (options.perPage) {
      params.set('perPage', options.perPage.toString());
    }
    if (options.fields) {
      for (const [key, value] of Object.entries(options.fields)) {
        params.set(`field_${key}`, String(value));
      }
    }

    const query = params.toString();
    return this.http.get<Trackor[]>(`v3/trackors${query ? `?${query}` : ''}`);
  }

  /**
   * Search for trackors
   */
  async search(
    trackorType: string,
    conditions: string,
    options: SearchOptions = {},
  ): Promise<Trackor[]> {
    const params = new URLSearchParams();
    params.set('trackorType', trackorType);
    if (conditions) {
      params.set('conditions', conditions);
    }
    if (options.perPage) {
      params.set('perPage', options.perPage.toString());
    }
    if (options.page) {
      params.set('page', options.page.toString());
    }
    if (options.fields && options.fields.length > 0) {
      params.set('fields', options.fields.join(','));
    }

    return this.http.get<Trackor[]>(`v3/trackors/search?${params.toString()}`);
  }

  /**
   * Get trackor type tree (hierarchy)
   */
  async getTree(): Promise<TrackorTreeNode> {
    return this.http.get<TrackorTreeNode>('v3/trackors/tree');
  }

  /**
   * Create a new trackor
   */
  async create(input: CreateTrackorInput): Promise<Trackor>;
  async create(trackorType: string, fields: Record<string, unknown>): Promise<Trackor>;
  async create(
    inputOrType: CreateTrackorInput | string,
    fields?: Record<string, unknown>,
  ): Promise<Trackor> {
    const body =
      typeof inputOrType === 'string'
        ? { trackorType: inputOrType, fields: fields ?? {} }
        : inputOrType;

    return this.http.post<Trackor>('v3/trackors', body);
  }

  /**
   * Update a trackor
   */
  async update(id: number, fields: Record<string, unknown>): Promise<Trackor> {
    return this.http.put<Trackor>(`v3/trackors/${id}`, { fields });
  }

  /**
   * Batch update multiple trackors
   */
  async batchUpdate(updates: UpdateTrackorInput[]): Promise<Trackor[]> {
    return this.http.post<Trackor[]>('v3/trackors/batch', updates);
  }

  /**
   * Delete a trackor
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`v3/trackors/${id}`);
  }
}
