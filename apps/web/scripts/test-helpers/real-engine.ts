// Shared fixture helper for content-batch tests that need a character in a
// particular mastery state. These tests used to build that state by calling
// the legacy `progress-eval.ts` evaluator directly; that evaluator is
// deleted (routing.md §1/§3 step 1 — one evaluator, not two, I5), so fixtures
// now run the real event chain through `@kanji-densha/engine` and read the
// result back through the same `toLegacyProgressState` projection production
// code uses. Nothing here re-implements or approximates scoring: every call
// goes through the one real `evaluateProgress`.
import {
  evaluateProgress,
  initialProgress,
  type CharacterProgress,
  type Lamp,
} from "@kanji-densha/engine";
import {
  requiredLamps,
  toEngineGradeParams,
  toLegacyProgressState,
} from "../../src/lib/legacy-progress-adapter.ts";
import type { GradeParams } from "../../src/lib/grade-params.ts";
import type { ProgressState } from "../../src/lib/progress-view.ts";

let seq = 0;
/** A fresh, distinct session id per fixture call — echo eligibility (MR-5.4)
 * requires the echo session to differ from the almost-granting session and
 * from every prior echo attempt. */
function nextSessionId(): string {
  seq += 1;
  return `fixture-${seq}`;
}

export function hoursFromIso(iso: string): number {
  return Date.parse(iso) / 3_600_000;
}

/** encounter + understand, nothing else — the common "taught" starting point. */
export function taught(char: string, appParams: GradeParams, nowIso: string): CharacterProgress {
  const params = toEngineGradeParams(appParams);
  const req = requiredLamps(true);
  let p = initialProgress(char);
  p = evaluateProgress(p, { type: "encounter", at: hoursFromIso(nowIso), sessionId: nextSessionId() }, params, req);
  p = evaluateProgress(p, { type: "understand", at: hoursFromIso(nowIso), sessionId: nextSessionId() }, params, req);
  return p;
}

export function answer(
  prev: CharacterProgress,
  appParams: GradeParams,
  input: {
    lamp: Lamp;
    correct: boolean;
    nowIso: string;
    mode?: "practice" | "echo";
    surfaceId?: string | null;
    soft?: boolean;
    sessionId?: string;
    shapeAvailable?: boolean;
  },
): CharacterProgress {
  const params = toEngineGradeParams(appParams);
  const req = requiredLamps(input.shapeAvailable ?? true);
  return evaluateProgress(
    prev,
    {
      type: "answer",
      at: hoursFromIso(input.nowIso),
      sessionId: input.sessionId ?? nextSessionId(),
      itemId: `${prev.characterId}:${input.lamp}:fixture`,
      lamp: input.lamp,
      correct: input.correct,
      mode: input.mode ?? "practice",
      surfaceId: input.surfaceId ?? null,
      soft: input.soft ?? false,
    },
    params,
    req,
  );
}

export function legacy(p: CharacterProgress, appParams: GradeParams): ProgressState {
  return toLegacyProgressState(p, toEngineGradeParams(appParams));
}
