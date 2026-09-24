import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/components/**', 'happy-dom'],
      ['tests/integration/components/**', 'happy-dom'],
    ],
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: [
      '__tests__/**/*.test.{ts,tsx}',
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/components/**/*.test.{ts,tsx}',
    ],
    globals: true,
  },
});
