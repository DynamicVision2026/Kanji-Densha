#!/usr/bin/env node
// `pnpm content:build` entrypoint. M0 placeholder: there is no content/ to build
// yet (that starts in M2). It exits 0 so the pipeline exists in CI from day one;
// the real parse -> validate -> gate -> emit lives here from M2 (architecture §2.2).
console.log('content:build — M0 placeholder: no content/ authored yet. Nothing to emit.');
process.exit(0);
