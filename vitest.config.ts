import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['__tests__/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    globals: true,
  },
});
