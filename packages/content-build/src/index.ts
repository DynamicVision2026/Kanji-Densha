// packages/content-build — the content gate (architecture §2.2). The CLI entry
// is build.ts (`pnpm content:build`); these exports are the reusable pieces the
// rejection suite and other tools test against. Nothing here is imported at
// runtime by apps/web (enforced by the eslint boundary).
export { gateCharacter, GATE_ERROR_CODES } from './gate.js';
export type { GateError, GateErrorCode, CharGateResult } from './gate.js';
export { loadReference, repoRootFrom, readingKey } from './reference.js';
export type { Reading, CharReadings } from './reference.js';
