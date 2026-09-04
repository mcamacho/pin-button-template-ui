import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/models': resolve(__dirname, 'src/models'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/utils': resolve(__dirname, 'src/utils'),
    }
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // `tests/integration` holds Playwright specs; they are run by `npm run
    // test:integration`, not by Vitest. Without this they are collected here
    // and fail at import time on `@playwright/test`.
    include: ['tests/unit/**/*.test.ts'],
    // ImageService decodes images via `new Image()` before drawing them to a
    // canvas. jsdom only fires load/error events on <img> when resource
    // loading is enabled, otherwise those code paths hang forever.
    environmentOptions: {
      jsdom: { resources: 'usable' },
    },
  },
  server: {
    port: 5173,
    open: true,
  }
})
