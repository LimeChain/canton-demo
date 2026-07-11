import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const sharedSrc = fileURLToPath(new URL('../packages/shared/src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@canton-demo\/shared$/,
        replacement: `${sharedSrc}/index.ts`,
      },
      {
        find: /^@canton-demo\/shared\/(.+)$/,
        replacement: `${sharedSrc}/$1`,
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
