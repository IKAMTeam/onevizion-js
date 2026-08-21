#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('Generating TypeScript types from openapi.json...');

try {
  execSync('npx openapi-typescript openapi.json -o src/types/openapi.ts', {
    cwd: rootDir,
    stdio: 'inherit',
  });
  console.log('✓ Types generated successfully at src/types/openapi.ts');
} catch (error) {
  console.error('Failed to generate types:', error.message);
  process.exit(1);
}
