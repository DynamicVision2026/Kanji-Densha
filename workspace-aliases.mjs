// Shared Vite/Vitest resolve.alias for internal `@kanji-densha/*` workspace
// packages. Package.json main/types/exports point at ./dist/*.js (used by
// plain-Node tooling — packages/content-build's CLI — and by `tsc -b`'s own
// project-reference resolution). Vite-based tools (Vitest, and apps/web's dev
// server) alias straight to source instead, so nothing needs a pre-build step
// before `pnpm test` or `pnpm dev` — the exact friction CLAUDE.md §4 asks M3
// to fix, not work around again with relative imports.
//
// One list, imported by every Vite-based config, so it cannot drift the way
// the gate-error-codes duplication once did.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const WORKSPACE_PACKAGES = ['engine', 'content-schema', 'content-build', 'store'];

export function workspaceAliases() {
  return Object.fromEntries(
    WORKSPACE_PACKAGES.map((pkg) => [
      `@kanji-densha/${pkg}`,
      join(here, 'packages', pkg, 'src', 'index.ts'),
    ]),
  );
}
