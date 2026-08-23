# Mastery rules (normative)

Status: **locked 2026-08-23.** This document is the implementation target for
`evaluateProgress`. Where it and the product specification appear to differ, this document
governs the engine and the difference is a spec erratum to raise, not a discretion to use.

Every rule is numbered. Engine fixtures must be named after the rule they encode
(`MR-6.3-failed-echo-preserves-almostAt.json`). If you cannot find a rule covering the case
you are implementing, that is an open question, not a judgement call.

---

## 1. State

```ts
interface CharacterProgress {
  characterId: string;               // NFC
  status: Status;                    // derived only — never assigned directly
  lamps: Record<Lamp, boolean>;
  encountered: boolean;
  understood: boolean;
  repairs: Lamp[];                   // outstanding repair kinds
  lostFlag: boolean;
  consecutiveWrong: Record<Lamp, number>;
  lifetimeWrong: Record<Lamp, number>;
  almostAt: number | null;
  almostSessionId: string | null;
  echoes: EchoAttempt[];             // { at, ok, sessionId }
  openEcho: OpenEcho | null;         // { startedAt, sessionId, results: Partial<Record<Lamp, boolean>> }
  seenSurfaces: string[];            // answered correctly at least once
  novelFailures: string[];           // surfaces that have spent their MR-4.3 exemption
  stampedAt: number | null;
}
```

**MR-1.1** `status` is a pure derivation of the other fields (§7). No branch of the engine
assigns it directly.

**MR-1.2** The engine derives surface novelty from `seenSurfaces` and `novelFailures`. The
event does **not** carry a `novelSurface` flag — a caller must not be able to claim novelty.
*(Change from architecture.md §1.2 as originally drafted.)*

**MR-1.3** The engine owns echo rounds via `openEcho`. There is no `echo_result` event — the
engine decides when a round is complete and whether it passed, so the UI cannot report an
outcome the answers do not support.

---

## 2. Events

```ts
type ProgressEvent =
  | { type: 'encounter';  at: number; sessionId: string }
  | { type: 'understand'; at: number; sessionId: string }
  | { type: 'answer'; at: number; sessionId: string; itemId: string;
      lamp: Lamp; correct: boolean; mode: 'practice' | 'echo';
      surfaceId: string | null; soft: boolean };
```

**MR-2.1** Unscored by design and never emitted: in-car announcements, 音の家族工房 attempts,
audio playback, and any parent-surface render.

**MR-2.2** `requiredLamps` is a parameter, not state: `['reading','meaning']` plus `'shape'`
if and only if the character has a published shape surface (D4).

---

## 3. Teaching beats

**MR-3.1** `encounter` sets `encountered = true`. Nothing else.

**MR-3.2** `understand` sets `understood = true` and clears `lostFlag`. This is the sole exit
from まよい (D3): a lost character passes through なおし on its way back, it does not jump
straight to だいたい.

**MR-3.3** Neither beat can change lamps, repairs, or counters.

---

## 4. Answers in practice mode

**MR-4.1 Correct, `soft: false`.** Light the lamp. Remove it from `repairs`. Reset
`consecutiveWrong[lamp]` to 0. If `surfaceId` is present, add it to `seenSurfaces`.

**MR-4.2 Correct, `soft: true`.** Remove the lamp from `repairs` and reset
`consecutiveWrong[lamp]`, but **do not light the lamp** (D9). Soft items — 似た駅名 and kin —
can repair, never light. Lighting requires a normal published item.

**MR-4.3 Wrong, exempt.** The answer is exempt from counting if either `soft` is true (D9), or
`surfaceId` is present and absent from both `seenSurfaces` and `novelFailures` (U2, first
failure on a novel word surface). On an exempt wrong: unlight the lamp, add it to `repairs`,
push `surfaceId` to `novelFailures` if applicable, and touch **neither** counter. A child
meeting a new word for the first time cannot be pushed toward まよい by it.

**MR-4.4 Wrong, counted.** Unlight the lamp, add it to `repairs`, increment both
`consecutiveWrong[lamp]` and `lifetimeWrong[lamp]`. This is the U2.4 case: a surface already
answered correctly, or a novel surface that has spent its exemption.

**MR-4.5 Lost threshold.** After MR-4.4, if `consecutiveWrong[lamp] >= lostConsecutiveWrong`
or `sum(lifetimeWrong) >= lostLifetimeWrong`, set `lostFlag = true`, `understood = false`,
`almostAt = null`, `almostSessionId = null`, and clear `echoes` and `openEcho`. The stamp is
never revoked (D7). Falling to まよい costs the week; it does not cost the memory of having
once arrived.

**MR-4.6 Force reteach.** If `forceReteachOnWrong` is set for the grade, any counted wrong
also sets `understood = false`.

**MR-4.7 In-session repair.** A correct answer clears the repair immediately, in the same
session, on any surface (D5). There is no cooling-off period on なおし.

---

## 5. Echo eligibility

The scheduler decides what to offer; the engine enforces the same predicate and rejects an
`answer` with `mode: 'echo'` that fails it. A rejected echo is an error, not a silent no-op.

**MR-5.1** `status` must be `almost`.

**MR-5.2 First echo.** `okEchoes === 0`, and `at >= almostAt + echoFirstDelayHours`.

**MR-5.3 Second echo.** `okEchoes === 1`, and `at >= almostAt + echoSecondDelayHours`
(≈168h, measured from `almostAt` — D1), **and** `at >= firstOkEcho.at + 48h`. The floor
guarantees a real gap even when the first echo was taken late.

**MR-5.4 Session distinctness.** The echo's `sessionId` must differ from `almostSessionId`
and from the `sessionId` of every prior echo attempt (D6). With MR-5.2 this makes a
same-session かんぺき structurally impossible, which is invariant I7.

**MR-5.5 Daily cap.** `echoPerDayCap` is a scheduler concern. The engine does not enforce it.

---

## 6. Echo rounds

**MR-6.1 Opening.** The first `answer` with `mode: 'echo'` in a session opens `openEcho` with
that `sessionId`. An echo answer arriving with a different `sessionId` than an open round
closes the stale round as failed and opens a new one.

**MR-6.2 Closing.** The round closes when every lamp in `requiredLamps` has a recorded result.
It passes only if all are correct. Push `{ at, ok, sessionId }` to `echoes` and clear
`openEcho`.

**MR-6.3 Failure.** A failed round preserves `almostAt` (D2). The failed lamps are unlit and
added to `repairs`, taking status to なおし. A failed attempt does **not** consume an echo
slot: eligibility counts successful echoes only. Once the lamp is re-lit the character is
eligible again in the next distinct session, with no new waiting period. One wrong tap does
not restart a seven-day clock.

**MR-6.4 Counting.** Individual wrong answers inside an echo round follow §4 exactly,
exemptions included.

**MR-6.5 Promotion.** When a round closes with `ok` and it is the second successful echo, the
character reaches かんぺき on this event.

**MR-6.6 Surfaces.** Echo uses the same elementary reading and prefers a surface not in
`seenSurfaces`; failing that, the same word in a new sentence frame. Surface selection is a
content/session concern; the engine only records what it is told was answered.

---

## 7. Status derivation

Evaluated after every event, in order — first match wins:

**MR-7.1** `lostFlag` → `lost`
**MR-7.2** `repairs.length > 0` → `fix`
**MR-7.3** `encountered && understood && requiredLamps.every(lit)`:
  - two or more successful echoes → `perfect`
  - otherwise → `almost`; if `almostAt` is null, set it to `event.at` and
    `almostSessionId` to `event.sessionId`
**MR-7.4** otherwise → `new`

**MR-7.5** `new` therefore covers every partially-lit state without outstanding repairs. A car
with one lamp on is still はじめて on the timetable. Five colours, no sixth.

**MR-7.6 Stamp.** On first entry to `perfect`, if `stampedAt` is null, set it to `event.at`.
Write-once, forever (D7).

**MR-7.7 Regression from perfect.** A counted wrong takes a perfect character to なおし with
`echoes` intact — re-lighting the lamp restores かんぺき immediately, no second week. But
crossing the まよい threshold clears the echo history (MR-4.5), and the road back is the full
journey. Severity ladder, deliberately.

**MR-7.8 No decay.** Status never changes with the passage of time alone (D8). `evaluateProgress`
is called only on events; there is no tick.

---

## 8. Out of scope for the engine

Session item caps, `itemsPerLamp`, `echoPerDayCap`, beat ordering, surface selection, and
which characters to offer today. All of these belong to the session builder and the echo
scheduler — both pure, both taking `now` as an argument, neither writing progress.
