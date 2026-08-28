# M1 architect review — PR #2

Reviewed 2026-08-23. **Verdict: one blocking change, then merge.** The engine shape,
the fixture discipline, and the clause-by-clause traceability are right. The problem is not
in the state machine; it is in how the coverage number was reached.

---

## Blocking — coverage was bought with safety

From the build report: to reach 100% branch coverage you removed *"an unreachable `else`, a
null-guard the caller already narrowed"* and *"cast the guaranteed-present echo."*

That is the coverage gate working against the codebase instead of for it. Three problems:

1. A cast to assert a value is present is exactly what `CLAUDE.md` §5 forbids — no `any`,
   no non-null `!`. "Guaranteed present" is a claim about today's control flow, and the
   engine will be edited by someone who does not remember today's control flow.
2. A defensive guard deleted to satisfy a metric is a guard that was doing its job by
   never firing. The metric is not the point; the engine is the point.
3. It sets a precedent. The next time coverage is at 98%, the cheapest move will be to
   delete the branch rather than test it, and nobody will notice for six months.

**Prescribed fix.** Add `packages/engine/src/invariant.ts`:

```ts
export function invariant(condition: unknown, clause: string): asserts condition {
  if (!condition) throw new EngineInvariantError(clause);
}
```

Restore every guard you removed, expressed through `invariant()` with the MR clause as the
message — `invariant(firstOkEcho, 'MR-5.3: okEchoes===1 implies a first successful echo')`.
Remove the cast; `asserts condition` narrows the type honestly, so TypeScript is satisfied
without a lie. Exclude `invariant.ts` from the coverage target: the gate is on
`evaluate.ts` specifically, so the unreachable throw lives outside it and the 100% number
stays true rather than negotiated.

Then add to `CLAUDE.md` §5: *coverage is never satisfied by deleting a guard or widening a
type. If a branch is genuinely unreachable, express it as an `invariant()` and say which
clause makes it unreachable.*

---

## Approved without change

**`EchoRejectedError` on ineligible echoes.** Correct per MR-5 — a rejected echo is a
scheduling bug, and it should be loud. One consequence to carry into M3: `store.apply` must
never let this surface to a child as an error screen. The scheduler is responsible for making
it unreachable; if it fires in production it is telemetry, not UI.

**MR-5.5 and MR-6.6 having no fixture.** Correct, and correctly declared. Both are named in
`mastery-rules.md` §8 as scheduler and session concerns the engine deliberately does not own.
Naming the gap in the PR rather than quietly hitting 35/35 is the behaviour I want to see
repeated.

**Two dev-dependencies.** Fine. Engine runtime dependencies stay at zero, which is the rule
that actually matters.

**Property tests with a fixed-seed PRNG.** Good instinct — determinism preserved, and the
purity gate flagging the literal string in your comments is the gate being bluntly correct
rather than wrong.

---

## Grade parameters — architect's values

These replace your defaults. Spec-anchored where the spec speaks; mine where it doesn't, and
mine are guesses too. The reason they live in one YAML file is that only children will settle
them.

| grade | sessionItemCap | itemsPerLamp | echoFirstDelayHours | echoSecondDelayHours | echoPerDayCap | lostConsecutiveWrong | lostLifetimeWrong | forceReteachOnWrong |
|---|---|---|---|---|---|---|---|---|
| 1 | 3 | 1 | 20 | 168 | 8 | 3 | 12 | true |
| 2 | 4 | 1 | 20 | 168 | 10 | 3 | 14 | true |
| 3 | 6 | 2 | 20 | 168 | 12 | 4 | 16 | false |
| 4 | 6 | 2 | 36 | 168 | 14 | 4 | 18 | false |
| 5 | 8 | 2 | 36 | 168 | 16 | 5 | 20 | false |
| 6 | 8 | 2 | 36 | 168 | 16 | 5 | 20 | false |

Reasoning worth recording in the file header:

- **`sessionItemCap` is a time budget, not a difficulty knob.** A ride is three to five
  minutes. Three items at G1 is a whole ride for a six-year-old; eight at G6 is still short.
- **`echoPerDayCap` is the single most dangerous number here.** It is the line between a
  daily two-minute return journey and a drill farm — which is the product this one exists in
  opposition to. Start low. Raise it only if real children finish and ask for more, never
  because the numbers look better.
- **`forceReteachOnWrong` is on for G1–G2 and off from G3.** At six, re-meeting the character
  costs nothing and carries no shame. At nine, interrupting a child who knows the character
  and simply slipped reads as being corrected, and the product's whole posture is that
  なおし is a repair, not a reprimand.
- **The lost thresholds loosen as grades rise** because later characters are harder and
  まよい must stay rare enough to mean something. A colour every child sees weekly is not a
  signal, it is wallpaper.

---

## Merge

Apply the invariant fix, push the grade parameters above, keep CI green, then merge M1
yourself — no second review needed for a change this bounded.
