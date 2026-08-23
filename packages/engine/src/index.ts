// packages/engine — the pure mastery state machine.
//
// M0 placeholder ONLY. The real domain types (Lamp, Status, CharacterProgress,
// ProgressEvent, GradeParams) and `evaluateProgress` land in M1, implemented
// clause-by-clause against docs/spec/mastery-rules.md (MR-1.1 .. MR-7.8).
//
// This package is pure, total, deterministic and zero-dependency (CLAUDE.md I6):
// no clock, no randomness, no I/O, no imports outside its own files. Time
// arrives inside the event. The engine-purity gate enforces this from commit 1.
export const ENGINE_PLACEHOLDER = 'engine' as const;

/** A pure, total, deterministic stand-in until M1's evaluateProgress. */
export function identity<T>(value: T): T {
  return value;
}
