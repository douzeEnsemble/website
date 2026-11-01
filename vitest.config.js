import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js', 'scripts/**/*.js'],
      reporter: ['text', 'html'],
      thresholds: { 100: true },
    },
  },
});
