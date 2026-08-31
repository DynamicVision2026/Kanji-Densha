import type { MasteryStatus, PracticeKind } from "./mastery";

/**
 * Read-only projections and UI hints over `ProgressState` — the legacy shape
 * every pre-harvest consumer (reports, route decoration, week-peek,
 * inspection, the ride UI) still reads. No status is computed here: this
 * file is what remains of `progress-eval.ts` once its scoring is deleted
 * (routing.md §1/§3 step 1) — `evaluateProgress`, `hydrateProgress`, and
 * every private helper that fed them are gone, not carried over. The one
 * writer of a `ProgressState` value now is `legacy-progress-adapter.ts`'s
 * `toLegacyProgressState`, projecting from `@kanji-densha/engine`'s real
 * `CharacterProgress` (I5).
 *
 * Timestamps are ISO-8601 UTC. Echo due is an absolute delay from `almost_at`
 * (`echo_delay_hours`), not a local-calendar "next morning".
 */

export type Lights = {
  reading: boolean;
  meaning: boolean;
  shape: boolean;
};

export type EvalParams = {
  echo_delay_hours: number;
  echo_per_day_cap: number;
  force_reteach_on_wrong: boolean;
  lost_wrong_threshold: number;
  lost_wrong_lifetime_threshold: number;
  reading_enabled: boolean;
  meaning_enabled: boolean;
  shape_enabled: boolean;
  echo_second_delay_hours?: number;
  perfect_echo_required?: number;
  perfect_decay_enabled?: boolean;
  decay_days?: number;
  perfect_decay_days?: number;
};

export type ProgressState = {
  kanji: string;
  status: MasteryStatus;
  lights: Lights;
  encounterCompleted: boolean;
  understandCompleted: boolean;
  seenAt: string | null;
  lastPracticeAt: string | null;
  almostAt: string | null;
  echoDueAt: string | null;
  perfectAt: string | null;
  correctStreakByKind: LightsCount;
  wrongCountByKind: LightsCount;
  consecutiveWrongByKind: LightsCount;
  repairRequiredKinds: PracticeKind[];
  attempts: number;
  /** Surface ids that have been answered correctly at least once. */
  surfacesSeenSuccess: string[];
  lastSuccessByKind: Partial<Record<PracticeKind, string>>;
  /** Successful 再訪 batches completed while almost. Perfect at threshold. */
  echoSuccessCount: number;
};

type LightsCount = Record<PracticeKind, number>;

export type BeatId = "encounter" | "understand" | "practice" | "echo" | "feedback";

const ZERO: LightsCount = { reading: 0, meaning: 0, shape: 0 };
const DARK: Lights = { reading: false, meaning: false, shape: false };
const DEFAULT_SECOND_ECHO_HOURS = 168;

export function emptyProgress(kanji: string): ProgressState {
  return {
    kanji,
    status: "new",
    lights: { ...DARK },
    encounterCompleted: false,
    understandCompleted: false,
    seenAt: null,
    lastPracticeAt: null,
    almostAt: null,
    echoDueAt: null,
    perfectAt: null,
    correctStreakByKind: { ...ZERO },
    wrongCountByKind: { ...ZERO },
    consecutiveWrongByKind: { ...ZERO },
    repairRequiredKinds: [],
    attempts: 0,
    surfacesSeenSuccess: [],
    lastSuccessByKind: {},
    echoSuccessCount: 0,
  };
}

export function requiredLights(
  params: Pick<EvalParams, "reading_enabled" | "meaning_enabled" | "shape_enabled">,
  shapeAvailable: boolean,
): PracticeKind[] {
  const out: PracticeKind[] = [];
  if (params.reading_enabled) out.push("reading");
  if (params.meaning_enabled) out.push("meaning");
  if (params.shape_enabled && shapeAvailable) out.push("shape");
  return out;
}

export function allRequiredLightsOn(
  state: ProgressState,
  required: PracticeKind[],
): boolean {
  return required.every((k) => state.lights[k]);
}

export function echoIsDue(state: ProgressState, nowIso: string): boolean {
  if (state.status !== "almost" || !state.echoDueAt) return false;
  return Date.parse(nowIso) >= Date.parse(state.echoDueAt);
}

/** Scoring 残響: stored progress only. Same predicate as echoIsDue. */
export function echoScoringEligible(state: ProgressState, nowIso: string): boolean {
  return echoIsDue(state, nowIso);
}

/** True when the visit is later than ~2× the scheduled delay. Never demotes. */
export function echoIsStale(
  state: ProgressState,
  nowIso: string,
  params: Pick<EvalParams, "echo_delay_hours" | "echo_second_delay_hours">,
): boolean {
  if (!echoIsDue(state, nowIso) || !state.echoDueAt) return false;
  const delayH =
    (state.echoSuccessCount ?? 0) >= 1
      ? (params.echo_second_delay_hours ?? DEFAULT_SECOND_ECHO_HOURS)
      : params.echo_delay_hours;
  return Date.parse(nowIso) >= Date.parse(state.echoDueAt) + delayH * 3600 * 1000;
}

export function echoAvailable(
  state: ProgressState,
  nowIso: string,
  echoesStartedToday: number,
  params: Pick<EvalParams, "echo_per_day_cap">,
): boolean {
  if (!echoIsDue(state, nowIso)) return false;
  return echoesStartedToday < params.echo_per_day_cap;
}

const DEFAULT_ECHO_REQUIRED = 2;

export function echoesNeeded(params: EvalParams): number {
  return params.perfect_echo_required ?? DEFAULT_ECHO_REQUIRED;
}

export function suggestBeat(
  state: ProgressState,
  params: EvalParams,
  shapeAvailable: boolean,
  nowIso: string,
  echoesStartedToday: number,
): BeatId {
  if (state.status === "perfect") return "feedback";
  if (!state.encounterCompleted) return "encounter";
  if (!state.understandCompleted) return "understand";
  if (echoAvailable(state, nowIso, echoesStartedToday, params)) return "echo";
  const required = requiredLights(params, shapeAvailable);
  if (!allRequiredLightsOn(state, required)) return "practice";
  return "feedback";
}

export function utcDay(iso: string): string {
  return iso.slice(0, 10);
}
