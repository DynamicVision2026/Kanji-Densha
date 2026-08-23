// packages/engine — the pure mastery state machine (architecture §1).
// Domain types live here and nowhere else (CLAUDE.md §5).
export type {
  Lamp,
  Status,
  Grade,
  EchoAttempt,
  OpenEcho,
  CharacterProgress,
  ProgressEvent,
  GradeParams,
} from './types.js';
export { LAMPS } from './types.js';
export { evaluateProgress, initialProgress, EchoRejectedError } from './evaluate.js';
export { EngineInvariantError } from './invariant.js';
