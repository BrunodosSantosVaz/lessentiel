import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.unit.test.ts'],
    coverage: { provider: 'v8', include: ['src/domain/**', 'src/application/**'], thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } },
  },
});
