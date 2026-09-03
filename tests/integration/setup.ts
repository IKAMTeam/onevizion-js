import { it } from 'vitest';
import { OneVizionClient, credentialsAuth } from '../../src/index.js';

/**
 * Integration test setup
 *
 * Set these environment variables to run integration tests:
 * - ONEVIZION_BASE_URL: https://your-sandbox.onevizion.com
 * - ONEVIZION_USERNAME: your-username
 * - ONEVIZION_PASSWORD: your-password
 *
 * Or use token auth:
 * - ONEVIZION_BASE_URL: https://your-sandbox.onevizion.com
 * - ONEVIZION_API_TOKEN: your-token
 */

export const INTEGRATION_ENABLED = !!(
  process.env.ONEVIZION_BASE_URL &&
  (process.env.ONEVIZION_API_TOKEN ||
    (process.env.ONEVIZION_USERNAME && process.env.ONEVIZION_PASSWORD))
);

export function createTestClient(): OneVizionClient {
  if (!process.env.ONEVIZION_BASE_URL) {
    throw new Error('ONEVIZION_BASE_URL is required');
  }

  const baseUrl = process.env.ONEVIZION_BASE_URL;

  // Token auth
  if (process.env.ONEVIZION_API_TOKEN) {
    return new OneVizionClient({
      baseUrl,
      auth: {
        getToken: async () => process.env.ONEVIZION_API_TOKEN ?? null,
        isAuthenticated: async () => !!process.env.ONEVIZION_API_TOKEN,
      },
    });
  }

  // Credentials auth
  if (process.env.ONEVIZION_USERNAME && process.env.ONEVIZION_PASSWORD) {
    return new OneVizionClient({
      baseUrl,
      auth: credentialsAuth({
        baseUrl,
        username: process.env.ONEVIZION_USERNAME,
        password: process.env.ONEVIZION_PASSWORD,
      }),
    });
  }

  throw new Error('Either ONEVIZION_API_TOKEN or ONEVIZION_USERNAME/PASSWORD required');
}

/**
 * Skip test if integration tests are not configured
 */
export const skipIfNoIntegration = (INTEGRATION_ENABLED ? it : it.skip) as typeof it;
