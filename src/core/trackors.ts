import type { TrackorFieldValue } from '../types/fields.js';
import type { HttpClient } from '../utils/http-client.js';

export interface TrackorFilters<
  TFields extends Partial<Record<string, TrackorFieldValue>> = Partial<
    Record<string, TrackorFieldValue>
  >,
> {
  /** Filter by trackor type */
  trackorType?: string;
  /** Filter by status */
  status?: string;
  /** Filter by fields (key-value pairs) */
  fields?: TFields;
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  perPage?: number;
}

/**
 * Trackor with type-safe custom fields
 *
 * @typeParam TFields - Shape of custom fields for this trackor type
 *
 * @example
 * ```typescript
 * // Typed trackor
 * type AssetTrackor = Trackor<{ name: string; quantity: number }>;
 *
 * const asset: AssetTrackor = {
 *   id: 123,
 *   trackorType: 'Asset',
 *   fields: {
 *     name: 'Laptop',
 *     quantity: 5,
 *   },
 * };
 * ```
 */
export interface Trackor<
  TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
> {
  readonly id: number;
  readonly trackorType: string;
  readonly fields: TFields;
}

export interface TrackorTypeTreeNode {
  readonly name: string;
  readonly label: string;
  readonly children?: TrackorTypeTreeNode[];
}

export interface CreateTrackorData<
  TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
> {
  trackorType: string;
  fields: TFields;
}

export interface UpdateTrackorData<
  TFields extends Partial<Record<string, TrackorFieldValue>> = Partial<
    Record<string, TrackorFieldValue>
  >,
> {
  fields: TFields;
}

/**
 * Trackors API client
 *
 * Immutable, functional API design with:
 * - Readonly return types
 * - Pure functions (no hidden state mutations)
 * - Composable operations
 * - Type-safe generics
 *
 * @example
 * ```typescript
 * // Get a trackor with typed fields
 * type Asset = { name: string; quantity: number };
 * const trackor = await client.trackors.get<Asset>(123);
 * console.log(trackor.fields.name); // Type-safe!
 *
 * // List with filters (composable)
 * const assets = await client.trackors.list<Asset>({
 *   trackorType: 'Asset',
 *   perPage: 10,
 * });
 * ```
 */
export class TrackorsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a trackor by ID (pure, immutable)
   *
   * @typeParam TFields - Custom fields shape for type safety
   */
  async get<TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>>(
    id: number,
    fields?: readonly string[],
  ): Promise<Trackor<TFields>> {
    const searchParams = new URLSearchParams();
    if (fields && fields.length > 0) {
      searchParams.set('fields', fields.join(','));
    }

    const query = searchParams.toString();
    const url = query ? `v3/trackors/${id}?${query}` : `v3/trackors/${id}`;

    return this.http.get<Trackor<TFields>>(url);
  }

  /**
   * List trackors with filters (pure, composable)
   *
   * @typeParam TFields - Custom fields shape for type safety
   */
  async list<TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>>(
    filters?: TrackorFilters<Partial<TFields>>,
  ): Promise<Trackor<TFields>[]> {
    const searchParams = new URLSearchParams();

    if (filters?.trackorType) {
      searchParams.set('trackorType', filters.trackorType);
    }

    if (filters?.status) {
      searchParams.set('status', filters.status);
    }

    if (filters?.fields) {
      // Functional approach - map over entries
      Object.entries(filters.fields).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(`field_${key}`, String(value));
        }
      });
    }

    if (filters?.page !== undefined) {
      searchParams.set('page', String(filters.page));
    }

    if (filters?.perPage !== undefined) {
      searchParams.set('perPage', String(filters.perPage));
    }

    const query = searchParams.toString();
    const url = query ? `v3/trackors?${query}` : 'v3/trackors';

    return this.http.get<Trackor<TFields>[]>(url);
  }

  /**
   * Create a new trackor (returns fresh immutable object)
   */
  async create<
    TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
  >(data: CreateTrackorData<TFields>): Promise<Trackor<TFields>> {
    return this.http.post<Trackor<TFields>>('v3/trackors', data);
  }

  /**
   * Update a trackor (returns fresh immutable object, doesn't mutate original)
   */
  async update<
    TFields extends Partial<Record<string, TrackorFieldValue>> = Partial<
      Record<string, TrackorFieldValue>
    >,
  >(id: number, data: UpdateTrackorData<TFields>): Promise<Trackor> {
    return this.http.put<Trackor>(`v3/trackors/${id}`, data);
  }

  /**
   * Delete a trackor (idempotent)
   */
  async delete(id: number): Promise<void> {
    return this.http.delete<void>(`v3/trackors/${id}`);
  }

  /**
   * Batch update trackors
   */
  async batchUpdate(
    updates: Array<{ id: number; fields: Record<string, unknown> }>,
  ): Promise<Trackor[]> {
    return this.http.post<Trackor[]>('v3/trackors/batch', { updates });
  }

  /**
   * Search trackors using query expressions
   *
   * @param trackorType - Trackor type name (e.g., 'ASSET', 'BILL_OF_MATERIALS')
   * @param searchQuery - Search expression string or SearchQuery builder
   * @param options - Search options (fields, view, pagination, sort)
   *
   * @example
   * ```typescript
   * import { search } from '@onevizion/sdk';
   *
   * // Using query builder
   * const results = await client.trackors.search('ASSET',
   *   search()
   *     .equal('STATUS', 'Active')
   *     .and()
   *     .greater('AMOUNT', 1000)
   * );
   *
   * // Using raw string
   * const results = await client.trackors.search('ASSET',
   *   'equal(STATUS, "Active") and greater(AMOUNT, 1000)'
   * );
   * ```
   */
  async search<
    TFields extends Record<string, TrackorFieldValue> = Record<string, TrackorFieldValue>,
  >(
    trackorType: string,
    searchQuery: string | { toString(): string },
    options?: {
      /** View name (e.g., "L:Default") */
      view?: string;
      /** Field names to return */
      fields?: readonly string[];
      /** Page number (1-indexed) */
      page?: number;
      /** Items per page (max 100000) */
      perPage?: number;
      /** Sort fields (e.g., ["CREATED_DATE:desc", "NAME:asc"]) */
      sort?: readonly string[];
    },
  ): Promise<Trackor<TFields>[]> {
    const searchParams = new URLSearchParams();

    if (options?.view) {
      searchParams.set('view', options.view);
    }

    if (options?.fields) {
      searchParams.set('fields', options.fields.join(','));
    }

    if (options?.page !== undefined) {
      searchParams.set('page', String(options.page));
    }

    if (options?.perPage !== undefined) {
      searchParams.set('perPage', String(options.perPage));
    }

    if (options?.sort) {
      options.sort.forEach((sortField) => {
        searchParams.append('sort', sortField);
      });
    }

    const query = searchParams.toString();
    const url = query
      ? `v3/trackor_types/${trackorType}/trackors/search?${query}`
      : `v3/trackor_types/${trackorType}/trackors/search`;

    const searchExpression = typeof searchQuery === 'string' ? searchQuery : searchQuery.toString();

    // POST search expression as text/plain body
    return this.http.post<Trackor<TFields>[]>(url, searchExpression);
  }

  /**
   * Get trackor type tree
   *
   * Returns hierarchical structure of all trackor types
   *
   * @example
   * ```typescript
   * const tree = await client.trackors.getTree();
   * console.log(tree.name, tree.children);
   * ```
   */
  async getTree(): Promise<TrackorTypeTreeNode> {
    return this.http.get<TrackorTypeTreeNode>('v3/trackor_tree');
  }
}
