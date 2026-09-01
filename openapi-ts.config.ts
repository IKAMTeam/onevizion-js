import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: 'fetch',
  input: './openapi.json',
  output: {
    path: './src/generated',
  },
  postProcess: ['biome:format'],
  types: {
    enums: 'javascript',
    dates: true,
  },
  services: {
    asClass: true,
  },
});
