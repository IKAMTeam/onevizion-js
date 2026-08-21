import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenAuth } from '../src/auth/token.js';
import { TrackorsClient } from '../src/core/trackors.js';
import type { Trackor } from '../src/core/trackors.js';
import { HttpClient } from '../src/utils/http-client.js';

describe('TrackorsClient', () => {
  let httpClient: HttpClient;
  let trackorsClient: TrackorsClient;
  let fetchMock: Mock;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://test.onevizion.com',
      auth: new TokenAuth('test-token'),
    });
    trackorsClient = new TrackorsClient(httpClient);
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    vi.resetAllMocks();
  });

  describe('get', () => {
    it('should fetch a trackor by ID', async () => {
      const mockTrackor: Trackor = {
        id: 123,
        trackorType: 'Asset',
        fields: { name: 'Laptop', quantity: 5 },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockTrackor,
      });

      const result = await trackorsClient.get(123);

      expect(result).toEqual(mockTrackor);
      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.url).toContain('/v3/trackors/123');
    });

    it('should include field parameter when specified', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123, trackorType: 'Asset', fields: {} }),
      });

      await trackorsClient.get(123, ['name', 'quantity']);

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.url).toContain('fields=name%2Cquantity');
    });
  });

  describe('list', () => {
    it('should fetch list of trackors', async () => {
      const mockTrackors: readonly Trackor[] = [
        { id: 1, trackorType: 'Asset', fields: {} },
        { id: 2, trackorType: 'Asset', fields: {} },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockTrackors,
      });

      const result = await trackorsClient.list();

      expect(result).toEqual(mockTrackors);
    });

    it('should apply filters to query string', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await trackorsClient.list({
        trackorType: 'Asset',
        status: 'Active',
        page: 2,
        perPage: 50,
      });

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      const url = request.url;
      expect(url).toContain('trackorType=Asset');
      expect(url).toContain('status=Active');
      expect(url).toContain('page=2');
      expect(url).toContain('perPage=50');
    });

    it('should handle field filters', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await trackorsClient.list({
        fields: { name: 'Test', quantity: 10 },
      });

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      const url = request.url;
      expect(url).toContain('field_name=Test');
      expect(url).toContain('field_quantity=10');
    });
  });

  describe('create', () => {
    it('should create a new trackor', async () => {
      const newTrackor = {
        trackorType: 'Asset',
        fields: { name: 'New Asset', quantity: 1 },
      };

      const createdTrackor: Trackor = {
        id: 999,
        ...newTrackor,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => createdTrackor,
      });

      const result = await trackorsClient.create(newTrackor);

      expect(result).toEqual(createdTrackor);
      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.method).toBe('POST');
      expect(request.url).toContain('/v3/trackors');
    });
  });

  describe('update', () => {
    it('should update a trackor', async () => {
      const updateData = {
        fields: { name: 'Updated Name' },
      };

      const updatedTrackor: Trackor = {
        id: 123,
        trackorType: 'Asset',
        fields: { name: 'Updated Name', quantity: 5 },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => updatedTrackor,
      });

      const result = await trackorsClient.update(123, updateData);

      expect(result).toEqual(updatedTrackor);
      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.method).toBe('PUT');
      expect(request.url).toContain('/v3/trackors/123');
    });
  });

  describe('delete', () => {
    it('should delete a trackor', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
      });

      await trackorsClient.delete(123);

      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.method).toBe('DELETE');
      expect(request.url).toContain('/v3/trackors/123');
    });
  });

  describe('batchUpdate', () => {
    it('should batch update multiple trackors', async () => {
      const updates = [
        { id: 1, fields: { name: 'Updated 1' } },
        { id: 2, fields: { name: 'Updated 2' } },
      ];

      const updatedTrackors: Trackor[] = [
        { id: 1, trackorType: 'Asset', fields: { name: 'Updated 1' } },
        { id: 2, trackorType: 'Asset', fields: { name: 'Updated 2' } },
      ];

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => updatedTrackors,
      });

      const result = await trackorsClient.batchUpdate(updates);

      expect(result).toEqual(updatedTrackors);
      const callArgs = fetchMock.mock.calls[0];
      const request = callArgs?.[0] as Request;
      expect(request.method).toBe('POST');
      expect(request.url).toContain('/v3/trackors/batch');
    });
  });
});
