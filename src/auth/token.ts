import type { AuthProvider } from '../types/index.js';

/**
 * Auth error types for functional API
 */
export type AuthError =
  | {
      readonly type: 'InvalidToken';
      readonly message: string;
    }
  | {
      readonly type: 'TokenExpired';
      readonly message: string;
    }
  | {
      readonly type: 'RefreshFailed';
      readonly message: string;
    };

/**
 * Token authentication provider for direct bearer token usage.
 *
 * Use this when you already have a valid API token from OneVizion.
 */
export class TokenAuth implements AuthProvider {
  constructor(private readonly token: string) {
    if (!token) {
      throw new Error('Token cannot be empty');
    }
  }

  async getToken(): Promise<string> {
    return this.token;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.token.length > 0;
  }
}

/**
 * Convenience factory for creating token auth
 */
export function tokenAuth(token: string): TokenAuth {
  return new TokenAuth(token);
}
