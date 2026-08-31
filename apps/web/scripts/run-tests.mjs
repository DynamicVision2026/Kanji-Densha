#!/usr/bin/env node
/**
 * Runs both node:test batches this workspace needs -- the loose `.mjs`
 * scripts and the `.ts` scripts that need `--experimental-strip-types` --
 * unconditionally, and aggregates the exit code.
 *
 * docs/reviews/remediation-plan.md R5: `package.json`'s `test` script used
 * to chain these with `&&`. A single failure in the first (`.mjs`) batch
 * short-circuited the whole command, so the second batch -- 252 tests, most
 * of this workspace's suite -- silently never ran. "One known pre-existing
 * failure" was never one failing test; it was one failing test plus a
 * quarter of the suite invisible on every single run, and nothing about
 * the output said so. Found by accident while doing something else, not by
 * design.
 *
 * This script is the fix: both batches always run, both exit codes are
 * reported by name, and the aggregate exit code is non-zero if either
 * batch failed -- so `pnpm test` (and anything that gates on it) can never
 * again report a partial suite as if it were the whole one.
 */
import { spawnSync } from "node:child_process";

// Kept as an explicit list, not a second glob, so a new .test.ts file is a
// deliberate addition here -- the same "no accidental drift" reasoning the
// routing/engine gates already use elsewhere in this repo.
const TS_FILES = [
  "scripts/items.test.ts",
  "scripts/readings.test.ts",
  "scripts/grade-params.test.ts",
  "scripts/stroke-assembly.test.ts",
  "scripts/echo-surfaces.test.ts",
  "scripts/lines.test.ts",
  "scripts/railway.test.ts",
  "scripts/phonetic-family.test.ts",
  "scripts/shape-gate.test.ts",
  "scripts/reading-audio.test.ts",
  "scripts/framework-f1f4.test.ts",
  "scripts/surface-batch1.test.ts",
  "scripts/audio-batch2.test.ts",
  "scripts/meaning-batch3.test.ts",
  "scripts/shape-batch4.test.ts",
  "scripts/encounter-batch5.test.ts",
  "scripts/scale-g2.test.ts",
  "scripts/scale-g3.test.ts",
  "scripts/scale-g4.test.ts",
  "scripts/scale-g5.test.ts",
  "scripts/scale-g6.test.ts",
  "scripts/scale-w61.test.ts",
  "scripts/scale-w62.test.ts",
  "scripts/scale-w63.test.ts",
  "scripts/scale-w64.test.ts",
  "scripts/final-polish.test.ts",
  "scripts/qa-kd.test.ts",
  "scripts/grade-nav.test.ts",
  "scripts/echo-arrival.test.ts",
  "scripts/shape-copy.test.ts",
  "scripts/week-taught.test.ts",
  "scripts/grade-route.test.ts",
  "scripts/grade-p2.test.ts",
  "scripts/ux-ia.test.ts",
  "scripts/train-overview.test.ts",
  "scripts/map-at-arrival.test.ts",
  "scripts/train-car.test.ts",
  "scripts/child-profiles.test.ts",
  "scripts/save-and-install.test.ts",
  "scripts/session-stub.test.ts",
  "scripts/legacy-progress-adapter.test.ts",
];

/** Runs one node:test batch with output streamed live; returns its exit code. */
function runBatch(label, args) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync("node", args, { stdio: "inherit" });
  if (result.error) throw result.error;
  // `null` status means the process was killed by a signal -- never
  // silently treat that as success.
  return result.status ?? 1;
}

const mjsExit = runBatch("scripts/**/*.test.mjs", ["--test", "scripts/**/*.test.mjs"]);
const tsExit = runBatch("scripts/*.test.ts (--experimental-strip-types)", [
  "--experimental-strip-types",
  "--test",
  ...TS_FILES,
]);

console.log(`\n=== summary ===`);
console.log(`scripts/**/*.test.mjs: ${mjsExit === 0 ? "pass" : `FAIL (exit ${mjsExit})`}`);
console.log(`scripts/*.test.ts:     ${tsExit === 0 ? "pass" : `FAIL (exit ${tsExit})`}`);

process.exit(mjsExit !== 0 || tsExit !== 0 ? 1 : 0);
