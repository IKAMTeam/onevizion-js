/**
 * Functional API Examples - Rust/Elm-like patterns
 *
 * Demonstrates:
 * - Result<T, E> for explicit error handling
 * - Option<T> for nullable values
 * - Pattern matching
 * - Functional composition
 * - No exceptions in core API
 */

import {
  OneVizionClient,
  type OneVizionError,
  type Result,
  type Trackor,
  andThen,
  mapResult,
  matchResult,
  tokenAuth,
  unwrapOr,
} from '@onevizion/sdk';

/**
 * Example 1: Basic Result handling with pattern matching
 */
async function example1_basicResult() {
  const authResult = tokenAuth('your-api-token');

  // Pattern matching on auth result
  const client = matchResult(authResult, {
    Ok: (auth) =>
      new OneVizionClient({
        baseUrl: 'https://app.onevizion.com',
        auth,
      }),
    Err: (error) => {
      console.error('Auth failed:', error.message);
      return null;
    },
  });

  if (!client) return;

  // Get a trackor - returns Result<Trackor, OneVizionError>
  const result = await client.trackors.get(123);

  // Pattern matching on the result
  matchResult(result, {
    Ok: (trackor) => console.log('Trackor:', trackor),
    Err: (error) => console.error('Error:', error.message),
  });
}

/**
 * Example 2: Inline Result checking (zero-cost discriminated union)
 */
async function example2_inlineChecks() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') {
    console.error('Auth failed:', authResult.error.message);
    return;
  }

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  const result = await client.trackors.get(123);

  // Inline discriminated union check
  if (result._tag === 'Ok') {
    console.log('Success:', result.value);
  } else {
    console.error('Failed:', result.error);
  }
}

/**
 * Example 3: Functional composition with map/andThen
 */
async function example3_composition() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  // Get trackor, extract name, provide default
  const result = await client.trackors.get(123);

  const trackorName = unwrapOr(
    mapResult(result, (trackor) => trackor.trackorType),
    'Unknown',
  );

  console.log('Trackor name:', trackorName);
}

/**
 * Example 4: Chaining operations with andThen (monadic composition)
 */
async function example4_chaining() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  // Get trackor, then update it
  const getResult = await client.trackors.get(123);

  const updateResult = await andThen(getResult, async (trackor) => {
    return client.trackors.update(trackor.id, {
      fields: { status: 'active' },
    });
  });

  matchResult(updateResult, {
    Ok: (updated) => console.log('Updated:', updated),
    Err: (error) => console.error('Update failed:', error),
  });
}

/**
 * Example 5: Error type discrimination
 */
async function example5_errorHandling() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  const result = await client.trackors.get(999999);

  if (result._tag === 'Err') {
    const error = result.error;

    // Discriminated union - exhaustive checking
    switch (error.type) {
      case 'NotFoundError':
        console.log('Trackor not found');
        break;
      case 'AuthenticationError':
        console.log('Auth failed, retry login');
        break;
      case 'NetworkError':
        console.log('Network issue, retry');
        break;
      case 'RateLimitError':
        console.log('Rate limited, wait', error.retryAfter, 'seconds');
        break;
      case 'ValidationError':
      case 'ServerError':
      case 'ApiError':
        console.log('API error:', error.message);
        break;
    }
  }
}

/**
 * Example 6: Multiple operations (functional pipeline)
 */
async function example6_pipeline() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  // Functional pipeline: list -> map -> filter -> process
  const listResult = await client.trackors.list({
    status: 'active',
    perPage: 10,
  });

  const activeCount = matchResult(listResult, {
    Ok: (trackors) => trackors.filter((t) => t.status === 'active').length,
    Err: (_error) => 0,
  });

  console.log('Active trackors:', activeCount);
}

/**
 * Example 7: Combining multiple Results
 */
async function example7_multipleResults() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  // Fetch multiple trackors
  const results = await Promise.all([
    client.trackors.get(1),
    client.trackors.get(2),
    client.trackors.get(3),
  ]);

  // Process each result independently
  const trackors = results
    .map((result) =>
      matchResult(result, {
        Ok: (t) => t,
        Err: (_e) => null,
      }),
    )
    .filter((t): t is Trackor => t !== null);

  console.log('Fetched trackors:', trackors.length);
}

/**
 * Example 8: Custom error recovery with orElse
 */
async function example8_errorRecovery() {
  const authResult = tokenAuth('your-api-token');
  if (authResult._tag === 'Err') return;

  const client = new OneVizionClient({
    baseUrl: 'https://app.onevizion.com',
    auth: authResult.value,
  });

  // Try primary, fallback to backup
  const primaryResult = await client.trackors.get(123);

  const result =
    primaryResult._tag === 'Err'
      ? await client.trackors.get(456) // fallback
      : primaryResult;

  matchResult(result, {
    Ok: (trackor) => console.log('Got trackor:', trackor.id),
    Err: (error) => console.error('Both failed:', error),
  });
}

// Run examples
async function main() {
  console.log('=== Functional API Examples ===\n');

  console.log('Example 1: Basic Result handling');
  await example1_basicResult();

  console.log('\nExample 2: Inline checks');
  await example2_inlineChecks();

  console.log('\nExample 3: Functional composition');
  await example3_composition();

  console.log('\nExample 4: Chaining operations');
  await example4_chaining();

  console.log('\nExample 5: Error type discrimination');
  await example5_errorHandling();

  console.log('\nExample 6: Pipeline operations');
  await example6_pipeline();

  console.log('\nExample 7: Multiple Results');
  await example7_multipleResults();

  console.log('\nExample 8: Error recovery');
  await example8_errorRecovery();
}

// Uncomment to run
// main().catch(console.error);
