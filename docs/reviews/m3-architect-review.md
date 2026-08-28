# M3 architect review — PR #5

Reviewed 2026-08-24. **Verdict: merge as-is, then one small follow-up PR before the child
session.** The slice is right: real workspace resolution rather than the relative-import
workaround, all four beats, real child-facing Japanese, axe clean per beat, and the I7
assertion that no amount of correct answering yields かんぺき in one session.

Finding an existing PR and asking rather than re-implementing four thousand tested lines was
the correct call and saved a day.

---

## Q16 is not a known limitation. It is an unimplemented feature — and it blocks the child session

`forceReteachOnWrong: true` at Grade 1 is my parameter, and its rationale is on record: *at
six, re-meeting the character costs nothing and carries no shame.* MR-4.6 therefore clears
`understood` on a counted wrong, and MR-7.3 will not grant だいたい without it. The engine is
behaving exactly as specified.

What is missing is the other half of that decision. **When the engine sends a child back to
わかる, the ride has to actually take them there.** Without it, one wrong tap dead-ends the
session: no sequence of correct answers can reach だいたい, and the child is stuck in a ride
that cannot end well.

Why this blocks the observation rather than merely annoying a tester: **a six-year-old will
get one wrong.** That is not an edge case, it is the median session. If the ride dead-ends
there, the child session observes a broken product, and — worse — the child may never reach
到着 at all, which is the screen carrying the entire product philosophy and the one I most
need watched.

And this is the interaction that matters most in the whole ride. What happens when a child is
wrong *is* the product's posture. Shipping a slice that has no answer to being wrong means the
first child session cannot see the thing the product is actually built on.

**Fix, as a small follow-up PR on its own branch.** On a counted wrong that clears
`understood`, the ride returns to わかる with warm, brief framing — 「もういちど みてみよう」 or
similar, marked `// COPY-REVIEW` — then continues to ためす. Not a modal, not an error state,
no red. A short return to the teaching beat, exactly as if the train had backed up one
station. Add an E2E case: wrong answer → reteach → correct → だいたい reached.

Rename Q16 from a limitation to a defect in the PR, and close it in the follow-up.

## Q15 — shape placeholder is fine, with one instruction

A stub that lights the lamp for pressing a button after watching is acceptable for M3 and
correctly scoped to be thrown away in M4. One instruction for the session that follows:
**exclude the shape beat from the observation notes entirely.** A child cannot fail it, so
nothing observed there is signal, and reading meaning into it would corrupt the notes that M4
gets designed from.

## The speaker gap — run the 山 audio pilot before the session

Hiding the speaker with no audio is I10 working correctly, and I would not accept a
placeholder. But it has a cost worth naming: **observation item 2 in the protocol — does the
child press the speaker without being told? — cannot be answered**, and audio is the one thing
this app does that paper cannot.

D16 is resolved: xAI TTS, cleared on ownership and the caching pattern, recorded 2026-08-24.
What remains outstanding is the attribution string and the native-speaker accent check —
neither of which prevents generating a handful of files through the proper process.

So: generate audio for **山 only** — its taught readings plus its word surfaces, four or five
files — with the generation parameters recorded per `docs/licenses.md`, and have a native
speaker check the pitch accent before the session. That is not a placeholder; it is the D16
quality-gate sample arriving early and doing double duty. If the accent is wrong, we learn it
now on five files rather than after generating eighty.

---

## Merge

Merge PR #5. Then the Q16 follow-up, then the audio pilot, then the child session. The
milestone closes when a child rides 山, not when CI is green.
