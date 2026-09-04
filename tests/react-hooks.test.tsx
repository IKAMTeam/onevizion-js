import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenAuth } from '../src/auth/token.js';
import { OneVizionClient } from '../src/client.js';
import { OneVizionProvider, useOneVizionClient } from '../src/react/context.js';
import { useCreateTrackor, useUpdateTrackor } from '../src/react/mutations.js';
import { useTrackor, useTrackorSearch, useTrackorTree, useTrackors } from '../src/react/queries.js';

// Test utilities
function createWrapper(client: OneVizionClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <OneVizionProvider client={client}>{children}</OneVizionProvider>
    </QueryClientProvider>
  );
}

describe('React Context', () => {
  it('should provide client through context', () => {
    const client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new TokenAuth('test-token'),
    });

    const wrapper = createWrapper(client);

    const { result } = renderHook(() => useOneVizionClient(), { wrapper });

    expect(result.current).toBe(client);
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useOneVizionClient());
    }).toThrow('useOneVizionClient must be used within OneVizionProvider');

    consoleError.mockRestore();
  });

  it('should render provider component', () => {
    const client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new TokenAuth('test-token'),
    });

    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <OneVizionProvider client={client}>
          <div>Test</div>
        </OneVizionProvider>
      </QueryClientProvider>,
    );

    expect(container.textContent).toBe('Test');
  });
});

describe('Query Hooks', () => {
  let client: OneVizionClient;
  let fetchMock: Mock;

  beforeEach(() => {
    client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new TokenAuth('test-token'),
    });
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    vi.resetAllMocks();
  });

  describe('useTrackor', () => {
    it('should fetch single trackor', async () => {
      const mockTrackor = {
        id: 123,
        trackorType: 'Asset',
        fields: { name: 'Test Asset' },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockTrackor,
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useTrackor(123), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTrackor);
      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors/123');
    });

    it('should handle trackor fetch error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Trackor not found',
        headers: new Headers(),
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useTrackor(999), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });

    it('should pass fields parameter', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123, trackorType: 'Asset', fields: {} }),
      });

      const wrapper = createWrapper(client);
      renderHook(() => useTrackor(123, { fields: ['name', 'status'] }), { wrapper });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('fields=name%2Cstatus'); // URL-encoded comma
    });
  });

  describe('useTrackors', () => {
    it('should fetch trackors list', async () => {
      const mockTrackors = [
        { id: 1, trackorType: 'Asset', fields: {} },
        { id: 2, trackorType: 'Asset', fields: {} },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockTrackors,
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useTrackors(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTrackors);
    });

    it('should apply filters', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const wrapper = createWrapper(client);
      renderHook(
        () =>
          useTrackors({
            filters: {
              trackorType: 'Asset',
              page: 2,
              perPage: 50,
            },
          }),
        { wrapper },
      );

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('trackorType=Asset');
      expect(request.url).toContain('page=2');
      expect(request.url).toContain('perPage=50');
    });
  });
});

describe('Mutation Hooks', () => {
  let client: OneVizionClient;
  let fetchMock: Mock;

  beforeEach(() => {
    client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new TokenAuth('test-token'),
    });
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    vi.resetAllMocks();
  });

  describe('useCreateTrackor', () => {
    it('should create trackor', async () => {
      const newTrackor = {
        id: 456,
        trackorType: 'Asset',
        fields: { name: 'New Asset' },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => newTrackor,
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useCreateTrackor(), { wrapper });

      result.current.mutate({
        trackorType: 'Asset',
        fields: { name: 'New Asset' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(newTrackor);
      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors');
      expect(request.method).toBe('POST');
    });

    it('should handle create error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid data',
        headers: new Headers(),
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useCreateTrackor(), { wrapper });

      result.current.mutate({
        trackorType: 'Asset',
        fields: {},
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpdateTrackor', () => {
    it('should update trackor', async () => {
      const updatedTrackor = {
        id: 123,
        trackorType: 'Asset',
        fields: { status: 'Updated' },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => updatedTrackor,
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useUpdateTrackor(), { wrapper });

      result.current.mutate({
        id: 123,
        data: {
          fields: { status: 'Updated' },
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedTrackor);
      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors/123');
      expect(request.method).toBe('PUT');
    });
  });
});

describe('Additional Query Hooks', () => {
  let client: OneVizionClient;
  let fetchMock: Mock;

  beforeEach(() => {
    client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new TokenAuth('test-token'),
    });
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    vi.resetAllMocks();
  });

  describe('useTrackorTree', () => {
    it('should fetch trackor type tree', async () => {
      const mockTree = {
        name: 'ROOT',
        label: 'Root',
        children: [
          { name: 'ASSET', label: 'Asset' },
          { name: 'TASK', label: 'Task' },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockTree,
      });

      const wrapper = createWrapper(client);
      const { result } = renderHook(() => useTrackorTree(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTree);
      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors/tree');
    });
  });

  describe('useTrackorSearch', () => {
    it('should search trackors with query builder', async () => {
      const mockResults = [
        { id: 1, trackorType: 'ASSET', fields: { STATUS: 'Active' } },
        { id: 2, trackorType: 'ASSET', fields: { STATUS: 'Active' } },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResults,
      });

      const wrapper = createWrapper(client);
      const query = 'STATUS = "Active"';
      const { result } = renderHook(() => useTrackorSearch('ASSET', query), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResults);
      const request = fetchMock.mock.calls[0]?.[0] as Request;
      expect(request.url).toContain('/api/v3/trackors/search');
    });
  });
});

describe('Integration Tests', () => {
  it('should work with widget auth in React app', async () => {
    // Mock iframe environment
    Object.defineProperty(window, 'top', {
      writable: true,
      configurable: true,
      value: {
        document: {
          querySelector: vi.fn().mockReturnValue({
            getAttribute: () => 'csrf-token',
          }),
        },
      },
    });

    // Mock token exchange
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'widget-bearer-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, trackorType: 'Asset' }],
      });

    const { WidgetAuth } = await import('../src/auth/widget.js');

    const client = new OneVizionClient({
      baseUrl: 'https://test.com',
      auth: new WidgetAuth({ baseUrl: 'https://test.com' }),
    });

    const wrapper = createWrapper(client);
    const { result } = renderHook(() => useTrackors(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    // First call is token exchange, second is API call
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
