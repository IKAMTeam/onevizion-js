import { TrackorsClient } from './core/trackors.js';
import { WorkflowsClient } from './core/workflows.js';
import type { OneVizionConfig } from './types/index.js';
import { HttpClient } from './utils/http-client.js';

/**
 * Main OneVizion API client
 *
 * @example
 * ```typescript
 * import { OneVizionClient, widgetAuth } from '@onevizion/sdk';
 *
 * const client = new OneVizionClient({
 *   baseUrl: 'https://app.onevizion.com',
 *   auth: widgetAuth({ baseUrl: 'https://app.onevizion.com' }),
 * });
 *
 * // Use resource clients
 * const trackor = await client.trackors.get(123);
 * const workflows = await client.workflows.list({ status: 'active' });
 * ```
 */
export class OneVizionClient {
  private readonly http: HttpClient;

  /** Trackors API */
  public readonly trackors: TrackorsClient;

  /** Workflows API */
  public readonly workflows: WorkflowsClient;

  constructor(config: OneVizionConfig) {
    this.http = new HttpClient(config);

    // Initialize resource clients
    this.trackors = new TrackorsClient(this.http);
    this.workflows = new WorkflowsClient(this.http);
  }

  /**
   * Get the underlying HTTP client for advanced usage
   */
  getHttpClient(): HttpClient {
    return this.http;
  }
}
