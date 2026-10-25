import { defineConfig } from 'vitest/config';

// Convex function tests only; the evidence-contract tests stay on `node --test`.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['convex/**/*.test.ts'],
    server: { deps: { inline: ['convex-test'] } },
  },
});
