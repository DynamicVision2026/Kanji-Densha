# Open questions

Rules: the implementer never resolves an entry here silently. Either the architect answers,
or the entry blocks the milestone named in it. Resolved entries move to `docs/decisions.md`
and become numbered clauses in `docs/spec/mastery-rules.md`.

As of 2026-08-23, Q1–Q13 are resolved and locked — see `docs/decisions.md`. **Nothing open
blocks any milestone.** One budget question remains, and one M3-scope question below has a
default I am proceeding under — flagged, not silently picked.

---

**Q15 — 山's shape lamp in M3, before M4 exists. Does not block M3; the default is stated.**
山 has `shape.published: true` and a `stroke_order` item (M2), so `requiredLamps` for it
includes `shape` (D4) — meaning M3's own exit criterion (a session lands at だいたい) requires
a real shape-lamp `answer` event, not just よみ/いみ. But the actual interactive stroke-order
UI (tap-to-select in order, unique a11y names per stroke, next-stroke hint) is M4's, and M4's
prompt was deliberately left unwritten so it could be designed from watching a child, not from
the spec (see `docs/m3-observation-protocol.md`).

**Default I am proceeding under:** the M3 Practice beat's shape step is a deliberately
minimal placeholder — the character's strokes are shown in order (a static diagram, not an
interactive tap target), with one button the child presses once they've watched it, which
emits a single `answer` event (`lamp: 'shape'`, `mode: 'practice'`) so the engine can light
the lamp for real. This is NOT M4's shape system pulled forward; it is a stand-in so M3's own
`almost` exit criterion is honestly reachable, built to be thrown away rather than extended
when M4 designs the real interaction. It is explicitly not a stroke-order *test* — it cannot
be answered wrong, so it cannot contaminate any まよい/なおし signal with a UI decision that
was never meant to be evaluative.

If this reasoning is wrong, or you'd rather M3 pick a character without a published shape
(there is none among the twenty — 学 is the only `shape.published: false` record and it is
Grade 1 but not 山), or hold M3's exit criterion at なおし short of the shape step: say so and
I'll change it. Proceeding with the default above so the milestone isn't blocked on it.

---

**Q14 — Licence a 教科書体 for the hero character? Blocks nothing.**
D11 settles UI type as Noto Sans JP and splits the hero glyph into its own token. The
remaining question is whether to pay for a 教科書体 face for that one token. The case for: a
gothic face teaches はね/とめ terminals and crossings that differ from what a child is marked
on at school. The case against: it is the sibling project's ¥250–300k/year class of expense,
the shape lamp does not depend on it, and one token is swappable at any time. Recommendation
is to defer until real children have used M3 and we know whether the hero glyph is where
their attention actually goes.
*Architect to answer after M3, not before.*

---

## Resolved

**Q11 — Kanji display font. ANSWERED 2026-08-23.** Resolved as D11; the residual budget
question is Q14 above.

**Q13 — Pre-existing content. ANSWERED 2026-08-23.** No content records, no audio, no
encounter art exist. What does exist is the national reference corpus — see
`docs/reference/README.md` and D13–D15. M2 keeps its shape (hand-author 20 characters) and
gains a Part 0: ingest the reference data and make it the gate's authority.
