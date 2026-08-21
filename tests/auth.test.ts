import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialsAuth, TokenAuth } from '../src/auth/index.js';
import { AuthenticationError } from '../src/utils/errors.js';

describe('TokenAuth', () => {
  it('should create with valid token', () => {
    const auth = new TokenAuth('test-token');
    expect(auth).toBeInstanceOf(TokenAuth);
  });

  it('should throw error for empty token', () => {
    expect(() => new TokenAuth('')).toThrow('Token cannot be empty');
  });

  it('should return token from getToken', async () => {
    const auth = new TokenAuth('test-token');
    const token = await auth.getToken();
    expect(token).toBe('test-token');
  });

  it('should return true for isAuthenticated', async () => {
    const auth = new TokenAuth('test-token');
    const isAuth = await auth.isAuthenticated();
    expect(isAuth).toBe(true);
  });
});

describe('CredentialsAuth', () => {
  beforeEach(() => {
    // Reset fetch mock
    vi.resetAllMocks();
  });

  it('should throw error for missing username', () => {
    expect(
      () =>
        new CredentialsAuth({
          baseUrl: 'https://test.com',
          username: '',
          password: 'pass',
        }),
    ).toThrow('Username and password are required');
  });

  it('should throw error for missing password', () => {
    expect(
      () =>
        new CredentialsAuth({
          baseUrl: 'https://test.com',
          username: 'user',
          password: '',
        }),
    ).toThrow('Username and password are required');
  });

  it('should fetch and cache token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'bearer-token' }),
    });

    const auth = new CredentialsAuth({
      baseUrl: 'https://test.com',
      username: 'user',
      password: 'pass',
    });

    const token = await auth.getToken();
    expect(token).toBe('bearer-token');

    // Second call should use cached token
    const token2 = await auth.getToken();
    expect(token2).toBe('bearer-token');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw AuthenticationError on failed fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid credentials',
    });

    const auth = new CredentialsAuth({
      baseUrl: 'https://test.com',
      username: 'user',
      password: 'wrong',
    });

    await expect(auth.getToken()).rejects.toThrow(AuthenticationError);
  });

  it('should refresh token when expired', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'token-2' }),
      });

    const auth = new CredentialsAuth({
      baseUrl: 'https://test.com',
      username: 'user',
      password: 'pass',
      tokenCacheDuration: 100, // 100ms
    });

    const token1 = await auth.getToken();
    expect(token1).toBe('token-1');

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    const token2 = await auth.getToken();
    expect(token2).toBe('token-2');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
