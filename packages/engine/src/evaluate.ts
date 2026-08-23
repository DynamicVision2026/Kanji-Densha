// The mastery state machine — the single source of `status` (I5, MR-1.1).
//
// Pure, total, deterministic, zero-dependency (I6). Time arrives inside the
// event; this file reads no clock and no RNG. `at` and the *DelayHours grade
// params share one time unit (hours), exactly as the MR-5 formulas are written
// (`at >= almostAt + echoFirstDelayHours`) — no conversion is applied.
//
// Every step cites the mastery-rules.md clause it implements. Implement against
// that document clause by clause; do not reconstruct the machine from prose.

import type {
  CharacterProgress,
  EchoAttempt,
  GradeParams,
  Lamp,
  ProgressEvent,
  Status,
} from './types.js';

/** D1 / MR-5.3: a real gap of at least this many hours after the first echo. */
const ECHO_SECOND_FLOOR_HOURS = 48;

/**
 * Thrown when an echo answer is offered that the eligibility predicate (MR-5)
 * rejects. A rejected echo is an error, not a silent no-op (mastery-rules §5).
 * `clause` names the rule that rejected it.
 */
export class EchoRejectedError extends Error {
  readonly clause: string;
  constructor(clause: string, message: string) {
    super(`${clause}: ${message}`);
    this.name = 'EchoRejectedError';
    this.clause = clause;
  }
}

/** A fresh, never-engaged character (status `new`). */
export function initialProgress(characterId: string): CharacterProgress {
  return {
    characterId,
    status: 'new',
    lamps: { reading: false, meaning: false, shape: false },
    encountered: false,
    understood: false,
    repairs: [],
    lostFlag: false,
    consecutiveWrong: { reading: 0, meaning: 0, shape: 0 },
    lifetimeWrong: { reading: 0, meaning: 0, shape: 0 },
    almostAt: null,
    almostSessionId: null,
    echoes: [],
    openEcho: null,
    seenSurfaces: [],
    novelFailures: [],
    stampedAt: null,
  };
}

// A mutable working copy. Everything the engine touches is cloned first so the
// input is never mutated (determinism / no aliasing).
interface Draft {
  characterId: string;
  status: Status;
  lamps: Record<Lamp, boolean>;
  encountered: boolean;
  understood: boolean;
  repairs: Lamp[];
  lostFlag: boolean;
  consecutiveWrong: Record<Lamp, number>;
  lifetimeWrong: Record<Lamp, number>;
  almostAt: number | null;
  almostSessionId: string | null;
  echoes: { at: number; ok: boolean; sessionId: string }[];
  openEcho: { startedAt: number; sessionId: string; results: Partial<Record<Lamp, boolean>> } | null;
  seenSurfaces: string[];
  novelFailures: string[];
  stampedAt: number | null;
}

function clone(p: CharacterProgress): Draft {
  return {
    characterId: p.characterId,
    status: p.status,
    lamps: { reading: p.lamps.reading, meaning: p.lamps.meaning, shape: p.lamps.shape },
    encountered: p.encountered,
    understood: p.understood,
    repairs: [...p.repairs],
    lostFlag: p.lostFlag,
    consecutiveWrong: {
      reading: p.consecutiveWrong.reading,
      meaning: p.consecutiveWrong.meaning,
      shape: p.consecutiveWrong.shape,
    },
    lifetimeWrong: {
      reading: p.lifetimeWrong.reading,
      meaning: p.lifetimeWrong.meaning,
      shape: p.lifetimeWrong.shape,
    },
    almostAt: p.almostAt,
    almostSessionId: p.almostSessionId,
    echoes: p.echoes.map((e) => ({ at: e.at, ok: e.ok, sessionId: e.sessionId })),
    openEcho:
      p.openEcho === null
        ? null
        : {
            startedAt: p.openEcho.startedAt,
            sessionId: p.openEcho.sessionId,
            results: { ...p.openEcho.results },
          },
    seenSurfaces: [...p.seenSurfaces],
    novelFailures: [...p.novelFailures],
    stampedAt: p.stampedAt,
  };
}

function addUnique<T>(arr: T[], x: T): void {
  if (!arr.includes(x)) arr.push(x);
}

function sumLifetime(d: Draft): number {
  return d.lifetimeWrong.reading + d.lifetimeWrong.meaning + d.lifetimeWrong.shape;
}

function okEchoCount(d: Draft): number {
  return d.echoes.filter((e) => e.ok).length;
}

/**
 * The one status algorithm (I5). Given the previous state and a single event,
 * returns the next state. `requiredLamps` is a content fact passed in, not
 * derived (MR-2.2): ['reading','meaning'] plus 'shape' iff a shape surface is
 * published.
 */
export function evaluateProgress(
  previous: CharacterProgress,
  event: ProgressEvent,
  params: GradeParams,
  requiredLamps: readonly Lamp[],
): CharacterProgress {
  const d = clone(previous);

  switch (event.type) {
    case 'encounter':
      d.encountered = true; // MR-3.1 — nothing else
      break;
    case 'understand':
      d.understood = true; // MR-3.2 — sole exit from まよい
      d.lostFlag = false;
      break;
    case 'answer':
      applyAnswer(d, event, params, requiredLamps);
      break;
  }

  deriveStatus(d, event, requiredLamps); // MR-7
  return d;
}

function applyAnswer(
  d: Draft,
  ev: Extract<ProgressEvent, { type: 'answer' }>,
  params: GradeParams,
  requiredLamps: readonly Lamp[],
): void {
  const isEcho = ev.mode === 'echo';

  // Open / continue / replace the echo round BEFORE §4 effects, so eligibility
  // (MR-5) is checked against the incoming status (MR-6.1).
  if (isEcho) openOrContinueEchoRound(d, ev, params);

  applyAnswerEffects(d, ev, params); // §4 — applies in both modes (MR-6.4)

  // Record the per-lamp result and close the round if complete. Skipped if the
  // §4 effects tripped まよい (which clears openEcho, MR-4.5).
  if (isEcho && d.openEcho !== null && !d.lostFlag) {
    recordAndMaybeCloseEcho(d, ev, requiredLamps, d.openEcho);
  }
}

// --- §5 / §6.1: opening an echo round ------------------------------------
function openOrContinueEchoRound(
  d: Draft,
  ev: Extract<ProgressEvent, { type: 'answer' }>,
  params: GradeParams,
): void {
  // Continue the round already open for this session (MR-6.1).
  if (d.openEcho !== null && d.openEcho.sessionId === ev.sessionId) return;

  // A different session than the open round closes the stale round as failed
  // and a new one is opened (MR-6.1). The failed attempt is recorded so it can
  // never be reused as a distinct session (MR-5.4) and never counts as a
  // successful echo (MR-6.3).
  if (d.openEcho !== null) {
    d.echoes.push({ at: ev.at, ok: false, sessionId: d.openEcho.sessionId });
    d.openEcho = null;
  }

  assertEchoEligible(d, ev, params); // MR-5 — throws if ineligible
  d.openEcho = { startedAt: ev.at, sessionId: ev.sessionId, results: {} };
}

function assertEchoEligible(
  d: Draft,
  ev: Extract<ProgressEvent, { type: 'answer' }>,
  params: GradeParams,
): void {
  if (d.status !== 'almost') {
    throw new EchoRejectedError('MR-5.1', 'echo requires status almost');
  }
  if (d.almostAt === null) {
    throw new EchoRejectedError('MR-5.1', 'almost without almostAt (unreachable)');
  }
  // MR-5.4 session distinctness.
  if (ev.sessionId === d.almostSessionId) {
    throw new EchoRejectedError('MR-5.4', 'echo session must differ from the almost-granting session');
  }
  if (d.echoes.some((e) => e.sessionId === ev.sessionId)) {
    throw new EchoRejectedError('MR-5.4', 'echo session must differ from every prior echo attempt');
  }

  // When status is `almost`, okEchoes is necessarily 0 or 1 (two successful
  // echoes would have derived `perfect`, not `almost`), so this is a clean
  // two-way split.
  if (okEchoCount(d) === 0) {
    // MR-5.2 first echo.
    if (ev.at < d.almostAt + params.echoFirstDelayHours) {
      throw new EchoRejectedError('MR-5.2', 'first echo before the first delay');
    }
    return;
  }
  // MR-5.3 second echo: measured from almostAt (D1), with a 48h floor after the
  // first successful echo. okEchoes === 1 here guarantees exactly one ok echo.
  const firstOk = d.echoes.find((e) => e.ok) as EchoAttempt;
  if (ev.at < d.almostAt + params.echoSecondDelayHours) {
    throw new EchoRejectedError('MR-5.3', 'second echo before the second delay');
  }
  if (ev.at < firstOk.at + ECHO_SECOND_FLOOR_HOURS) {
    throw new EchoRejectedError('MR-5.3', 'second echo before the 48h floor after the first');
  }
}

// --- §4: answer effects (practice and echo alike) -------------------------
function applyAnswerEffects(
  d: Draft,
  ev: Extract<ProgressEvent, { type: 'answer' }>,
  params: GradeParams,
): void {
  const L = ev.lamp;

  if (ev.correct) {
    d.repairs = d.repairs.filter((x) => x !== L); // MR-4.7 in-session repair
    d.consecutiveWrong[L] = 0;
    if (!ev.soft) {
      // MR-4.1 correct, non-soft: light the lamp and record the surface.
      d.lamps[L] = true;
      if (ev.surfaceId !== null) addUnique(d.seenSurfaces, ev.surfaceId);
    }
    // MR-4.2 correct, soft: repaired and counter reset, but the lamp is NOT lit.
    return;
  }

  // Wrong. Novelty is derived (MR-1.2 / MR-4.3), never declared by the caller.
  const surfaceNovel =
    ev.surfaceId !== null &&
    !d.seenSurfaces.includes(ev.surfaceId) &&
    !d.novelFailures.includes(ev.surfaceId);
  const exempt = ev.soft || surfaceNovel;

  d.lamps[L] = false; // MR-4.3 / MR-4.4: unlight and repair either way
  addUnique(d.repairs, L);

  if (exempt) {
    // MR-4.3 wrong, exempt: spend the novel-surface exemption if that is why it
    // was exempt; touch neither counter.
    if (ev.surfaceId !== null && surfaceNovel) addUnique(d.novelFailures, ev.surfaceId);
    return;
  }

  // MR-4.4 wrong, counted.
  d.consecutiveWrong[L] += 1;
  d.lifetimeWrong[L] += 1;

  // MR-4.5 lost threshold.
  if (
    d.consecutiveWrong[L] >= params.lostConsecutiveWrong ||
    sumLifetime(d) >= params.lostLifetimeWrong
  ) {
    d.lostFlag = true;
    d.understood = false;
    d.almostAt = null;
    d.almostSessionId = null;
    d.echoes = [];
    d.openEcho = null;
    // Stamp is never revoked (D7): stampedAt untouched.
  }

  // MR-4.6 force reteach on any counted wrong, where the grade sets it.
  if (params.forceReteachOnWrong) {
    d.understood = false;
  }
}

// --- §6.2 / §6.3 / §6.5: closing an echo round ----------------------------
function recordAndMaybeCloseEcho(
  d: Draft,
  ev: Extract<ProgressEvent, { type: 'answer' }>,
  requiredLamps: readonly Lamp[],
  round: NonNullable<Draft['openEcho']>,
): void {
  round.results[ev.lamp] = ev.correct; // MR-6.4 counting already done in §4

  // MR-6.2 close when every required lamp has a recorded result.
  const complete = requiredLamps.every((l) => l in round.results);
  if (!complete) return;

  const ok = requiredLamps.every((l) => round.results[l] === true);
  d.echoes.push({ at: ev.at, ok, sessionId: round.sessionId });
  d.openEcho = null;
  // MR-6.3 failure: almostAt was never touched here, so it is preserved; the
  // failed lamps are already unlit+repaired by §4 → status falls to なおし.
  // MR-6.5 promotion to かんぺき is handled by deriveStatus (okEchoes >= 2).
}

// --- §7: status derivation (first match wins) -----------------------------
function deriveStatus(
  d: Draft,
  ev: ProgressEvent,
  requiredLamps: readonly Lamp[],
): void {
  if (d.lostFlag) {
    d.status = 'lost'; // MR-7.1
    return;
  }
  if (d.repairs.length > 0) {
    d.status = 'fix'; // MR-7.2
    return;
  }

  const allLit = requiredLamps.every((l) => d.lamps[l]);
  if (d.encountered && d.understood && allLit) {
    // MR-7.3
    if (okEchoCount(d) >= 2) {
      d.status = 'perfect';
      if (d.stampedAt === null) d.stampedAt = ev.at; // MR-7.6 stamp, write-once
      return;
    }
    d.status = 'almost';
    if (d.almostAt === null) {
      d.almostAt = ev.at;
      d.almostSessionId = ev.sessionId;
    }
    return;
  }

  d.status = 'new'; // MR-7.4 / MR-7.5 — every partial state without repairs
}
