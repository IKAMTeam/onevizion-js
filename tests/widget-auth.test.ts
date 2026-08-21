import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WidgetAuth } from '../src/auth/widget.js';
import { AuthenticationError } from '../src/utils/errors.js';

// Mock window.top and window.self for iframe detection
const mockWindowTop = () => {
  Object.defineProperty(window, 'top', {
    writable: true,
    configurable: true,
    value: {
      document: {
        querySelector: vi.fn(),
      },
    },
  });

  Object.defineProperty(window, 'self', {
    writable: true,
    configurable: true,
    value: window,
  });
};

describe('WidgetAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockWindowTop();
  });

  describe('CSRF Token Extraction', () => {
    it('should extract CSRF token from parent iframe', async () => {
      // Mock being in iframe with CSRF token
      const mockQuerySelector = vi.fn().mockReturnValue({
        getAttribute: () => 'test-csrf-token',
      });

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'bearer-token' }),
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });
      const token = await auth.getToken();

      expect(token).toBe('bearer-token');
      expect(mockQuerySelector).toHaveBeenCalledWith('meta[name="_csrf"]');
      expect(global.fetch).toHaveBeenCalledWith(
        '/widget/GenerateApiTokenForWebSession',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-CSRF-TOKEN': 'test-csrf-token',
          }),
        }),
      );
    });

    it('should throw error when CSRF token not found', async () => {
      const mockQuerySelector = vi.fn().mockReturnValue(null);

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      await expect(auth.getToken()).rejects.toThrow(
        'CSRF token not found. Ensure this is running in a OneVizion widget iframe.',
      );
    });

    it('should throw error when not in iframe', async () => {
      // Mock not being in iframe
      Object.defineProperty(window, 'top', {
        writable: true,
        configurable: true,
        value: window.self,
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      await expect(auth.getToken()).rejects.toThrow(
        'WidgetAuth must be used within an iframe context',
      );
    });
  });

  describe('Token Exchange', () => {
    beforeEach(() => {
      const mockQuerySelector = vi.fn().mockReturnValue({
        getAttribute: () => 'test-csrf-token',
      });

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }
    });

    it('should exchange CSRF token for bearer token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'bearer-token-123' }),
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });
      const token = await auth.getToken();

      expect(token).toBe('bearer-token-123');
      expect(global.fetch).toHaveBeenCalledWith(
        '/widget/GenerateApiTokenForWebSession',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-TOKEN': 'test-csrf-token',
          }),
        }),
      );
    });

    it('should use relative URL for iframe compatibility', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'bearer-token' }),
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });
      await auth.getToken();

      // Verify it uses relative URL, not absolute
      expect(global.fetch).toHaveBeenCalledWith(
        '/widget/GenerateApiTokenForWebSession',
        expect.any(Object),
      );
    });

    it('should throw AuthenticationError on failed token exchange', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid CSRF token',
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      await expect(auth.getToken()).rejects.toThrow(AuthenticationError);
      await expect(auth.getToken()).rejects.toThrow('Failed to generate API token');
    });

    it('should throw error when response missing token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}), // No token in response
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      await expect(auth.getToken()).rejects.toThrow(
        'Invalid response format: missing or invalid token',
      );
    });
  });

  describe('Token Caching', () => {
    beforeEach(() => {
      const mockQuerySelector = vi.fn().mockReturnValue({
        getAttribute: () => 'test-csrf-token',
      });

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }
    });

    it('should cache token and not refetch on subsequent calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'cached-token' }),
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      const token1 = await auth.getToken();
      const token2 = await auth.getToken();
      const token3 = await auth.getToken();

      expect(token1).toBe('cached-token');
      expect(token2).toBe('cached-token');
      expect(token3).toBe('cached-token');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only fetched once
    });

    it('should refresh token when cache expires', async () => {
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

      const auth = new WidgetAuth({
        baseUrl: 'https://test.com',
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

    it('should use custom cache duration', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'token' }),
      });

      const auth = new WidgetAuth({
        baseUrl: 'https://test.com',
        tokenCacheDuration: 5000, // 5 seconds
      });

      await auth.getToken();

      // Token should still be cached after 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await auth.getToken();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Token Management', () => {
    beforeEach(() => {
      const mockQuerySelector = vi.fn().mockReturnValue({
        getAttribute: () => 'test-csrf-token',
      });

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }
    });

    it('should clear cached token', async () => {
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

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      const token1 = await auth.getToken();
      expect(token1).toBe('token-1');

      auth.clearToken();

      const token2 = await auth.getToken();
      expect(token2).toBe('token-2');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should manually refresh token', async () => {
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

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });

      await auth.getToken();
      const newToken = await auth.refreshToken();

      expect(newToken).toBe('token-2');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token can be obtained', async () => {
      const mockQuerySelector = vi.fn().mockReturnValue({
        getAttribute: () => 'test-csrf-token',
      });

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'token' }),
      });

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });
      const isAuth = await auth.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when token cannot be obtained', async () => {
      const mockQuerySelector = vi.fn().mockReturnValue(null); // No CSRF token

      if (window.top) {
        window.top.document.querySelector = mockQuerySelector;
      }

      const auth = new WidgetAuth({ baseUrl: 'https://test.com' });
      const isAuth = await auth.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });
});
