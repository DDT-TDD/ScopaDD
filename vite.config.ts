import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 8134,
    strictPort: true,
  },
  preview: {
    port: 8135,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
});
