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

/**
 * Unicode-safe Base64 encoding for HTTP Basic Auth
 */
function unicodeBtoa(str: string): string {
  // Convert to UTF-8 bytes, then to base64
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(Number.parseInt(p1, 16)),
    ),
  );
}

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
  private refreshPromise: Promise<string> | null = null; // Race condition protection

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      // Unicode-safe Base64 encoding
      const authString = unicodeBtoa(`${this.config.username}:${this.config.password}`);

      const response = await fetch(`${this.config.baseUrl}/api/v3/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new AuthenticationError(
          `Failed to authenticate: ${response.statusText}`,
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

    this.refreshPromise = this.fetchBearerToken()
      .then((token) => {
        this.token = token;
        this.tokenExpiry = Date.now() + this.tokenCacheDuration;
        return token;
      })
      .finally(() => {
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
