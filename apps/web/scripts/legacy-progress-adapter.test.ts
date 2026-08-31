import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateProgress,
  initialProgress,
  nextEchoEligibleAtHours,
} from "@kanji-densha/engine";
import type { GradeParams } from "@kanji-densha/engine";
import { toLegacyProgressState } from "../src/lib/legacy-progress-adapter.ts";

// docs/reviews/remediation-plan.md R2 — `almostAt`/`ev.at` are hours-since-epoch
// everywhere in the engine (packages/engine/src/evaluate.ts), never
// milliseconds. A real almostAt is large (hours since 1970, not a small
// offset), so a unit-mismatched formula and the correct one land on visibly
// different decades, not just different minutes.
const PARAMS: GradeParams = {
  grade: 1,
  sessionItemCap: 6,
  itemsPerLamp: 2,
  echoFirstDelayHours: 20,
  echoSecondDelayHours: 168,
  echoPerDayCap: 3,
  lostConsecutiveWrong: 3,
  lostLifetimeWrong: 6,
  forceReteachOnWrong: false,
};
const REQUIRED_LAMPS = ["reading", "meaning"] as const;

function practiceAnswer(at: number, sessionId: string, lamp: "reading" | "meaning") {
  return {
    type: "answer" as const,
    at,
    sessionId,
    itemId: `${lamp}-item`,
    lamp,
    correct: true,
    mode: "practice" as const,
    surfaceId: "yama",
    soft: false,
  };
}

function echoAnswer(at: number, sessionId: string, lamp: "reading" | "meaning") {
  return { ...practiceAnswer(at, sessionId, lamp), mode: "echo" as const };
}

function almostProgress(atHours: number) {
  let p = initialProgress("山");
  p = evaluateProgress(p, { type: "encounter", at: atHours, sessionId: "s0" }, PARAMS, REQUIRED_LAMPS);
  p = evaluateProgress(p, { type: "understand", at: atHours, sessionId: "s0" }, PARAMS, REQUIRED_LAMPS);
  p = evaluateProgress(p, practiceAnswer(atHours, "s0", "reading"), PARAMS, REQUIRED_LAMPS);
  p = evaluateProgress(p, practiceAnswer(atHours, "s0", "meaning"), PARAMS, REQUIRED_LAMPS);
  assert.equal(p.status, "almost");
  return p;
}

test("echoDueAt (UI/ticket path) is the same instant as the engine's own echo-eligibility boundary", () => {
  // A realistic almostAt: hours since epoch right now, not a small offset —
  // this is what makes the old bug's decades-off answer visible.
  const atHours = Math.floor(Date.now() / 3_600_000);
  const progress = almostProgress(atHours);

  const engineBoundaryHours = nextEchoEligibleAtHours(progress, PARAMS);
  assert.notEqual(engineBoundaryHours, null);
  const expectedIso = new Date((engineBoundaryHours as number) * 3600_000).toISOString();

  const legacy = toLegacyProgressState(progress, PARAMS);
  assert.equal(legacy.echoDueAt, expectedIso);

  // The regression this guards against: the old formula added a
  // milliseconds-denominated delay to an hours-denominated almostAt and
  // read the sum as milliseconds, landing within a day of 1970-01-01
  // instead of ~20 hours from a 2026+ instant.
  assert.ok(
    new Date(legacy.echoDueAt as string).getUTCFullYear() > 2020,
    `echoDueAt landed at ${legacy.echoDueAt}, which is not a real future date`,
  );
});

test("echoDueAt is null once perfect (no third echo boundary)", () => {
  const atHours = Math.floor(Date.now() / 3_600_000);
  let p = almostProgress(atHours);

  // First echo round, eligible at atHours + echoFirstDelayHours(20).
  p = evaluateProgress(p, echoAnswer(atHours + 20, "echo1", "reading"), PARAMS, REQUIRED_LAMPS);
  p = evaluateProgress(p, echoAnswer(atHours + 20, "echo1", "meaning"), PARAMS, REQUIRED_LAMPS);
  assert.equal(p.status, "almost"); // one successful echo — still almost, per MR-5

  // Second echo round, well past both the second-delay and 48h-floor boundaries.
  p = evaluateProgress(p, echoAnswer(atHours + 300, "echo2", "reading"), PARAMS, REQUIRED_LAMPS);
  p = evaluateProgress(p, echoAnswer(atHours + 300, "echo2", "meaning"), PARAMS, REQUIRED_LAMPS);
  assert.equal(p.status, "perfect");

  const legacy = toLegacyProgressState(p, PARAMS);
  assert.equal(legacy.echoDueAt, null);
});
