import type { AuthProvider } from '../types/index.js';
import { AuthenticationError } from '../utils/errors.js';

export interface WidgetAuthConfig {
  /** Base URL for the OneVizion API */
  baseUrl: string;
  /** Optional token cache duration in milliseconds (default: 3600000 = 1 hour) */
  tokenCacheDuration?: number;
}

/**
 * Widget authentication provider for embedded iframe widgets.
 *
 * This provider extracts the CSRF token from the parent iframe and exchanges it
 * for a bearer token via the /widget/GenerateApiTokenForWebSession endpoint.
 *
 * Requirements:
 * - Must be running in an iframe with proper sandbox attributes:
 *   allow-same-origin, allow-scripts
 * - Parent page must have a CSRF token meta tag
 */
export class WidgetAuth implements AuthProvider {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly tokenCacheDuration: number;

  constructor(config: WidgetAuthConfig) {
    // baseUrl is stored in config for future use with absolute URLs if needed
    this.tokenCacheDuration = config.tokenCacheDuration ?? 3600000; // 1 hour default
  }

  /**
   * Check if running in an iframe
   */
  private isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      // Cross-origin access blocked - we're definitely in an iframe
      return true;
    }
  }

  /**
   * Extract CSRF token from parent window
   */
  private getCsrfToken(): string | null {
    if (!this.isInIframe()) {
      return null;
    }

    try {
      // Try to access parent document (requires allow-same-origin sandbox)
      const csrfMeta = window.top?.document.querySelector('meta[name="_csrf"]');
      return csrfMeta?.getAttribute('content') ?? null;
    } catch (error) {
      throw new AuthenticationError(
        'Failed to access parent document. Ensure iframe has allow-same-origin sandbox attribute.',
        undefined,
        undefined,
        error,
      );
    }
  }

  /**
   * Exchange CSRF token for bearer token
   */
  private async fetchBearerToken(csrfToken: string): Promise<string> {
    try {
      // IMPORTANT: Use relative URL for iframe compatibility
      const response = await fetch('/widget/GenerateApiTokenForWebSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new AuthenticationError(
          `Failed to generate API token: ${response.statusText}`,
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
        'Network error while fetching API token',
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
    const csrfToken = this.getCsrfToken();

    if (!csrfToken) {
      throw new AuthenticationError(
        'CSRF token not found. Ensure this is running in a OneVizion widget iframe.',
      );
    }

    this.token = await this.fetchBearerToken(csrfToken);
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
   * Clear cached token (useful for testing or manual logout)
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }
}

/**
 * Convenience factory for creating widget auth
 */
export function widgetAuth(config: WidgetAuthConfig): WidgetAuth {
  return new WidgetAuth(config);
}
