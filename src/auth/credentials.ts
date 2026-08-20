import type { AuthProvider } from '../types/index.js';
import { AuthenticationError } from '../utils/errors.js';

export interface CredentialsAuthConfig {
  /** Base URL for the OneVizion API */
  baseUrl: string;
  /** Username */
  username: string;
  /** Password */
  password: string;
  /** Optional token cache duration in milliseconds (default: 3600000 = 1 hour) */
  tokenCacheDuration?: number;
}

/**
 * Credentials authentication provider for development/testing.
 *
 * WARNING: This should NOT be used in production environments.
 * Use TokenAuth or WidgetAuth instead.
 *
 * This provider exchanges username/password for a bearer token.
 */
export class CredentialsAuth implements AuthProvider {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly tokenCacheDuration: number;

  constructor(private readonly config: CredentialsAuthConfig) {
    this.tokenCacheDuration = config.tokenCacheDuration ?? 3600000; // 1 hour default

    if (!config.username || !config.password) {
      throw new Error('Username and password are required');
    }
  }

  /**
   * Exchange credentials for bearer token
   */
  private async fetchBearerToken(): Promise<string> {
    try {
      const authString = btoa(`${this.config.username}:${this.config.password}`);

      const response = await fetch(`${this.config.baseUrl}/api/v3/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AuthenticationError(
          `Failed to authenticate: ${response.statusText}`,
          response.status,
          await response.text(),
        );
      }

      const data = (await response.json()) as { token?: string };

      if (!data.token) {
        throw new AuthenticationError('API token not found in response', response.status, data);
      }

      return data.token;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(
        'Network error while authenticating',
        undefined,
        undefined,
        error,
      );
    }
  }

  async getToken(): Promise<string | null> {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Token expired or missing - refresh it
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    this.token = await this.fetchBearerToken();
    this.tokenExpiry = Date.now() + this.tokenCacheDuration;
    return this.token;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return token !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached token
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

/**
 * Convenience factory for creating credentials auth
 *
 * WARNING: Not recommended for production use
 */
export function credentialsAuth(config: CredentialsAuthConfig): CredentialsAuth {
  return new CredentialsAuth(config);
}
