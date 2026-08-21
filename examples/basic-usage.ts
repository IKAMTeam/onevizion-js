/**
 * Basic usage example for OneVizion SDK
 */

import { OneVizionClient, tokenAuth } from '@onevizion/sdk';

async function main() {
  // Create client with token authentication
  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: tokenAuth('your-api-token-here'),
  });

  try {
    // Get a single trackor
    const trackor = await client.trackors.get(123);
    console.log('Trackor:', trackor);

    // List trackors with filters
    const trackors = await client.trackors.list({
      trackorType: 'Asset',
      status: 'Active',
      page: 1,
      perPage: 10,
    });
    console.log('Trackors:', trackors);

    // Create a new trackor
    const newTrackor = await client.trackors.create({
      trackorType: 'Asset',
      fields: {
        name: 'New Asset',
        status: 'Active',
      },
    });
    console.log('Created trackor:', newTrackor);

    // Update a trackor
    const updatedTrackor = await client.trackors.update(newTrackor.id, {
      fields: {
        status: 'Inactive',
      },
    });
    console.log('Updated trackor:', updatedTrackor);

    // List workflows
    const workflows = await client.workflows.list({ status: 'active' });
    console.log('Workflows:', workflows);

    // Execute a workflow
    const execution = await client.workflows.execute(1, {
      trackorId: 123,
      parameters: {
        action: 'approve',
      },
    });
    console.log('Workflow execution:', execution);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
