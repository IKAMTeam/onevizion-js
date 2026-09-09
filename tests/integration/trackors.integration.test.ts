import { describe, expect } from 'vitest';
import { createTestClient, skipIfNoIntegration } from './setup.js';

describe('Trackors Integration', () => {
  skipIfNoIntegration('should fetch trackor tree', async () => {
    const client = createTestClient();
    const tree = await client.trackors.getTree();

    expect(tree).toBeDefined();
    expect(tree.name).toBeDefined();
    expect(tree.label).toBeDefined();
  });

  skipIfNoIntegration('should search trackors', async () => {
    const client = createTestClient();
    // Get first trackor type from tree
    const tree = await client.trackors.getTree();
    const firstType = tree.children?.[0]?.name || tree.name;

    // Search with no conditions (get all)
    const trackors = await client.trackors.search(firstType, '', { perPage: 10 });

    expect(Array.isArray(trackors)).toBe(true);
    expect(trackors.length).toBeGreaterThanOrEqual(0);
    expect(trackors.length).toBeLessThanOrEqual(10);
  });

  skipIfNoIntegration('should get trackor by id', async () => {
    const client = createTestClient();
    // Get first trackor from search
    const tree = await client.trackors.getTree();
    const firstType = tree.children?.[0]?.name || tree.name;
    const trackors = await client.trackors.search(firstType, '', { perPage: 1 });

    if (trackors.length === 0 || !trackors[0]) {
      return;
    }

    const firstTrackor = trackors[0];
    const trackor = await client.trackors.get(firstTrackor.id);

    expect(trackor).toBeDefined();
    expect(trackor.id).toBe(firstTrackor.id);
    expect(trackor.trackorType).toBeDefined();
  });
});
