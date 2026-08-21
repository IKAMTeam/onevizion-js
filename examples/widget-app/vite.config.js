import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@onevizion/sdk': resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    host: true,
    allowedHosts: [
      process.env.TUNNEL_HOST, // e.g., 7ae0-50-47-231-156.ngrok-free.app
      '.ngrok-free.app', // Allow any ngrok subdomain
      '.trycloudflare.com', // Allow cloudflared too
    ].filter(Boolean), // Remove undefined values
    cors: {
      origin: ['https://cleary-dev.onevizion.com', 'https://cleary-dev.onevizion.com:443'],
      credentials: true,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Single bundle
      },
    },
  },
});
