# R2 — echo due-date unit mismatch

Same seeded progress for 雨 (`almostAt` fixed, status `almost`, zero echoes), same route,
same viewport — only `legacy-progress-adapter.ts`'s `computeEchoDueAt` differs between the
two captures.

- **URL:** `http://127.0.0.1:8130/demo/kanji/雨?mode=play` (local dev server)
- **Viewport:** 390×844
- **Auth state:** guest (`VITE_AUTH_ENABLED=false`)
- **Old-code capture:** built from `main`'s `legacy-progress-adapter.ts` as of
  `e6a5212` (pre-R2), everything else identical to the fix
- **Fixed capture:** this PR's `legacy-progress-adapter.ts`

| Old code (bug) | Fixed |
|---|---|
| ![old code says today](./雨-old-code-says-today-390.png) | ![fixed says tomorrow](./雨-fixed-says-tomorrow-390.png) |
| つぎの とうちゃく：**きょう** | つぎの とうちゃく：**あした** |

The old adapter added a millisecond-denominated delay to an hours-denominated `almostAt`
(see `packages/engine/src/evaluate.ts`'s file header: no conversion is ever applied to
these values), landing the computed due date within a day of 1970-01-01.
`echo-arrival.ts`'s day-diff math then clamps anything in the past to `"today"` — so instead
of crashing or looking wrong, it silently told the family the train was already back. This
is the same instant shown two ways: the raw ISO value from the unit test in the R2 PR is
`1970-01-01T20:08:16.713Z` for the old code, `2026-09-01T05:00:00.000Z` for the fixed one,
for the identical `CharacterProgress`.

Kept here, not just in the PR body, because it's the clearest single image of what the
"two implementations of one rule" fault (docs/reviews/remediation-plan.md) actually costs a
family — worth having on hand the next time someone wonders why
`check-echo-eligibility-single-source.mjs` exists.
