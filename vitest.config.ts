import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    // Disable CSS processing in tests
    postcss: {},
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/**',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'v0-archive/**',
      ],
      thresholds: {
        // Temporarily reduced during v2 migration
        // TODO: Increase back to 50% when v2 code is fully tested
        lines: 20,
        functions: 20,
        branches: 20,
        statements: 20,
      },
    },
    // Mock environment variables for tests
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/kemotown_test',
      NEXTAUTH_SECRET: 'test-secret-for-vitest',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
