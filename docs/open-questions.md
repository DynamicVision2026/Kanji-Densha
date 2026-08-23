# Open questions

Rules: the implementer never resolves an entry here silently. Either the architect answers,
or the entry blocks the milestone named in it. Resolved entries move to `docs/decisions.md`
and become numbered clauses in `docs/spec/mastery-rules.md`.

As of 2026-08-23, Q1–Q13 are resolved and locked — see `docs/decisions.md`. **Nothing open
blocks any milestone.** One budget question remains.

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
