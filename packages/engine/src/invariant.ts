// Engine invariants.
//
// A branch that today's control flow makes unreachable is expressed HERE — with
// the mastery-rules clause that guarantees its unreachability — rather than
// deleted to satisfy a coverage metric or hidden behind a type cast (CLAUDE.md
// §5). `asserts condition` narrows the type honestly, so TypeScript is satisfied
// without a lie, and the value is never asserted-present with `!` or `as`.
//
// invariant.ts is deliberately OUTSIDE the evaluate.ts coverage target: the
// throw fires only if a future edit breaks an assumption, so it is unreachable
// today. Keeping it out of the measured file means the 100% branch number on
// evaluateProgress stays true rather than negotiated.

export class EngineInvariantError extends Error {
  readonly clause: string;
  constructor(clause: string) {
    super(`engine invariant violated — ${clause}`);
    this.name = 'EngineInvariantError';
    this.clause = clause;
  }
}

/** Assert an engine invariant. `clause` names the rule that guarantees it. */
export function invariant(condition: unknown, clause: string): asserts condition {
  if (!condition) throw new EngineInvariantError(clause);
}
