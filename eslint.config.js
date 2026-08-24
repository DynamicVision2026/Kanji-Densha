// Flat ESLint config. The import-boundary rules here are half of M0's point:
// they are enforced in CI (a failing lint blocks merge), not left to review.
// See docs/architecture.md §3 (import boundaries) and CLAUDE.md invariants I2/I6.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'content-dist/**',
    ],
  },

  // Base JS/TS recommended.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node scripts and build tooling are plain ESM with Node globals.
  {
    files: ['**/*.mjs', 'eslint.config.js', 'vitest.config.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
      },
    },
  },

  // --- Boundary: apps/web ---------------------------------------------------
  // I2 / architecture §3: the child app ships only content-dist/. It may not
  // import raw authoring data (content/) nor the build tooling (content-build).
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/content/*', '**/content', 'content/*', '../content/*', '../../content/*', '../../../content/*'],
            message: 'apps/web must not import raw content/. Ship content-dist/ only (I2, architecture §3).',
          },
          {
            group: ['@kanji-densha/content-build', '@kanji-densha/content-build/*'],
            message: 'apps/web must not import content-build at runtime (architecture §3: nothing imports content-build at runtime).',
          },
        ],
      }],
    },
  },

  // --- Boundary: packages/engine -------------------------------------------
  // I6 / architecture §1: the engine is pure and zero-dependency. Its runtime
  // source may not import any external module, any Node builtin, or any other
  // workspace package — ONLY relative imports (./x, ../x) are allowed. The regex
  // forbids every specifier that is not relative.
  {
    files: ['packages/engine/**/*.ts'],
    ignores: ['packages/engine/**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            regex: '^(?!\\.\\.?/)',
            message: 'packages/engine is pure and zero-dependency (I6): no external, Node-builtin, or cross-package imports; relative imports only.',
          },
        ],
      }],
    },
  },
  // Engine tests are not the pure runtime: they may import vitest. The purity
  // gate (scripts/check-engine-purity.mjs) still scans them for clock/RNG/I-O
  // tokens, so a test cannot smuggle impurity into the engine either.
  {
    files: ['packages/engine/**/*.test.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
