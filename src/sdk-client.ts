import type { AuthProvider, OneVizionConfig } from './types/index.js';
import { client as generatedClient } from './generated/client.gen.js';
import type { Client } from './generated/client/types.gen.js';
import type { Auth } from './generated/core/auth.gen.js';

/**
 * OneVizion SDK Client
 *
 * Wraps the generated API client with authentication and a clean interface
 */
export class OneVizionClient {
  private client: Client;
  private auth: AuthProvider;

  constructor(config: OneVizionConfig) {
    this.auth = config.auth;
    this.client = generatedClient;

    // Configure the generated client with auth callback
    this.client.setConfig({
      baseUrl: `${config.baseUrl}/api`,
      auth: async (_authScheme: Auth) => {
        // Get token from our AuthProvider
        const token = await this.auth.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }
        return token;
      },
    });
  }

  /**
   * Get the underlying generated client for direct access to all endpoints
   *
   * @example
   * ```typescript
   * const client = new OneVizionClient({ ... });
   *
   * // Access generated functions directly
   * await client.getClient().comOnevizionWebControllerApiV3TrackorByTidJsonApiControllerV3_get({
   *   path: { trackor_id: 123 }
   * });
   * ```
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get auth token (useful for debugging or manual requests)
   */
  async getToken(): Promise<string | null> {
    return this.auth.getToken();
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }
}
