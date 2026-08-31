/**
 * One-way projection: `CharacterProgress` (the real engine's output, written
 * only by `evaluateProgress` — I5) → `ProgressState` (the shape all 23
 * pre-harvest consumers already read). Reads flow out through this; writes
 * go only through the real engine. Nothing downstream can produce a status —
 * every caller of this function can only read a projection of one that
 * `evaluateProgress` already computed.
 *
 * This exists so the engine swap doesn't require rewriting every consumer in
 * one pass. `server/progress.ts` (account) and `demo-progress.ts` (guest) are
 * the only two files that write: each calls the real engine directly, then
 * this adapter to produce the read-side projection. Every other consumer
 * keeps compiling, untouched, against the same field names it always used.
 * Delete this file, one consumer at a time, as each moves to
 * `CharacterProgress` natively — it is meant to shrink, not to become
 * permanent scaffolding.
 *
 * Not every field this shape wants has a source in the real engine — some
 * were never engine state at all (`attempts`, `correctStreakByKind`,
 * `lastSuccessByKind`) or belong to the app layer, not the pure function
 * (`seenAt`, `lastPracticeAt` — MR-8: out of scope for the engine). Those
 * fields degrade honestly to null/zero/empty rather than being invented.
 * Every consumer of the missing ones already null-coalesces past them
 * (`week-peek.ts`, `inspection.ts`) or treats them as optional variety hints
 * (`items.ts`, `kanji-session.tsx`) — confirmed by reading each call site
 * before writing this, not assumed. None of it is I5-relevant: mastery
 * status, lamps, echo eligibility, and repairs — the parts that actually
 * decide what a child sees — all come straight from the real engine.
 */
import { nextEchoEligibleAtHours } from "@kanji-densha/engine";
import type { CharacterProgress, GradeParams as EngineGradeParams, Lamp } from "@kanji-densha/engine";
import type { ProgressState } from "./progress-view";
import type { GradeParams as LegacyGradeParams } from "./grade-params";

const LAMPS: readonly Lamp[] = ["reading", "meaning", "shape"];

function zeroByKind(): Record<Lamp, number> {
  return { reading: 0, meaning: 0, shape: 0 };
}

/**
 * `echoDueAt` was a stored column in the old model. The real engine doesn't
 * store it — MR-8 makes echo timing a scheduler concern, computed from
 * `almostAt` + params at read time.
 *
 * R2 (docs/reviews/remediation-plan.md): this used to re-derive the MR-5.2/5.3
 * formula inline, and did it wrong — `almostAt` and `ev.at` are hours-since-epoch
 * everywhere in the engine (see evaluate.ts's file-level comment), but this
 * function treated `almostAt` as an epoch-millisecond timestamp and added a
 * millisecond delay to it, producing a boundary a few hours after 1970-01-01,
 * not a real due date. `nextEchoEligibleAtHours` is the engine's own boundary
 * calculation, in its own hours unit; this function's only remaining job is
 * the one, single hours→ms conversion for display. There is now exactly one
 * implementation of echo eligibility — a UI can no longer offer an echo the
 * engine would then reject with `EchoRejectedError`, because it cannot compute
 * a different boundary than the one that rejection would be checked against.
 */
function computeEchoDueAt(progress: CharacterProgress, params: EngineGradeParams): string | null {
  const dueAtHours = nextEchoEligibleAtHours(progress, params);
  return dueAtHours === null ? null : new Date(dueAtHours * 3600_000).toISOString();
}

function iso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

export function toLegacyProgressState(
  progress: CharacterProgress,
  params: EngineGradeParams,
): ProgressState {
  const okEchoes = progress.echoes.filter((e) => e.ok).length;
  return {
    kanji: progress.characterId,
    status: progress.status,
    lights: { ...progress.lamps },
    encounterCompleted: progress.encountered,
    // Two-way, not one-way: MR-4.5/4.6 can flip `understood` back to false
    // when the old model's `understandCompleted` never went backwards. That
    // is not a mismatch to paper over — a character mid-reteach SHOULD read
    // as needing the わかる beat again, and every consumer that branches on
    // this field wants exactly that (it's the Q16 fix, arrived at for free).
    understandCompleted: progress.understood,
    seenAt: null, // not tracked by the engine; app-layer concern if ever needed
    lastPracticeAt: null, // not tracked by the engine
    almostAt: iso(progress.almostAt),
    echoDueAt: computeEchoDueAt(progress, params),
    perfectAt: iso(progress.stampedAt),
    correctStreakByKind: zeroByKind(), // no engine concept of a correct streak
    wrongCountByKind: { ...progress.lifetimeWrong },
    consecutiveWrongByKind: { ...progress.consecutiveWrong },
    repairRequiredKinds: [...progress.repairs],
    attempts: LAMPS.reduce((n, l) => n + progress.lifetimeWrong[l], 0) + okEchoes, // approximate floor, not exact — engine doesn't count correct answers
    surfacesSeenSuccess: [...progress.seenSurfaces],
    lastSuccessByKind: {}, // no per-lamp "last surface" memory in the engine
    echoSuccessCount: okEchoes,
  };
}

/** `server/progress.ts`'s own params (snake_case, more fields than the
 * engine needs) → the engine's `GradeParams`. The engine has no concept of
 * most of these (session caps, UI toggles, decay) — MR-8 keeps them out on
 * purpose. Decay fields are read by nothing here: D8 forbids decay, and the
 * real engine has no decay branch to feed params into. */
export function toEngineGradeParams(p: LegacyGradeParams): EngineGradeParams {
  return {
    grade: p.grade,
    sessionItemCap: p.max_items_per_session,
    itemsPerLamp: p.echo_items_per_light,
    echoFirstDelayHours: p.echo_delay_hours,
    echoSecondDelayHours: p.echo_second_delay_hours,
    echoPerDayCap: p.echo_per_day_cap,
    lostConsecutiveWrong: p.lost_wrong_threshold,
    lostLifetimeWrong: p.lost_wrong_lifetime_threshold,
    forceReteachOnWrong: p.force_reteach_on_wrong,
  };
}

/** D4/MR-2.2: requiredLamps is reading+meaning always, plus shape iff the
 * character has published shape data — computed once by the caller, not
 * derived per-event from a `shapeAvailable` flag on the event itself (the
 * old model's approach). */
export function requiredLamps(shapeAvailable: boolean): Lamp[] {
  return shapeAvailable ? ["reading", "meaning", "shape"] : ["reading", "meaning"];
}
