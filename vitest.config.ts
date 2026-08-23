import { defineConfig } from 'vitest/config';

// One test runner across the workspace. Each package keeps its tests next to
// its source as *.test.ts. Coverage is opt-in per package milestone (M1 sets
// the 100%-branch bar on evaluateProgress specifically, not repo-wide).
export default defineConfig({
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.ts',
    ],
    environment: 'node',
  },
});
