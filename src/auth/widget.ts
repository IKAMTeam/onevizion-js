import type { AuthProvider } from '../types/index.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * Type guard for token response validation
 */
interface TokenResponse {
  token: string;
}

function isTokenResponse(data: unknown): data is TokenResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'token' in data &&
    typeof (data as { token: unknown }).token === 'string' &&
    (data as { token: string }).token.length > 0
  );
}

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
  private refreshPromise: Promise<string> | null = null; // Race condition protection

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
      throw new AuthenticationError('WidgetAuth must be used within an iframe context');
    }

    try {
      // Try to access parent document (requires allow-same-origin sandbox)
      const csrfMeta = window.top?.document.querySelector('meta[name="_csrf"]');
      return csrfMeta?.getAttribute('content') ?? null;
    } catch (error) {
      // Check if it's a SecurityError (cross-origin access)
      if (error instanceof DOMException && error.name === 'SecurityError') {
        throw new AuthenticationError(
          'Cross-origin access denied. WidgetAuth requires same-origin iframe or allow-same-origin sandbox attribute.',
          undefined,
          undefined,
          error,
        );
      }
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      // IMPORTANT: Use relative URL for iframe compatibility
      const response = await fetch('/widget/GenerateApiTokenForWebSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new AuthenticationError(
          `Failed to generate API token: ${response.statusText}`,
          response.status,
          await response.text(),
        );
      }

      const data: unknown = await response.json();

      // Runtime validation with type guard
      if (!isTokenResponse(data)) {
        throw new AuthenticationError(
          'Invalid response format: missing or invalid token',
          response.status,
          data,
        );
      }

      return data.token;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AuthenticationError('Token fetch timeout after 10 seconds');
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

    // If refresh is already in progress, wait for it (prevent race condition)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Token expired or missing - refresh it
    return this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    // Reuse in-flight refresh request
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const csrfToken = this.getCsrfToken();

      if (!csrfToken) {
        throw new AuthenticationError(
          'CSRF token not found. Ensure this is running in a OneVizion widget iframe.',
        );
      }

      const token = await this.fetchBearerToken(csrfToken);
      this.token = token;
      this.tokenExpiry = Date.now() + this.tokenCacheDuration;

      return token;
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
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
