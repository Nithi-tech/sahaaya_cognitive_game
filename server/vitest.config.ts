import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only pick up test files in the server's own src directory.
    // This prevents vitest from crawling upward to the root vitest.config.ts
    // when the test runner is invoked from inside the server/ directory.
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Tests run sequentially because they share a real SQLite file.
    // singleThread is the Vitest 4 equivalent of the old singleFork poolOption.
    singleThread: true,
  },
});
