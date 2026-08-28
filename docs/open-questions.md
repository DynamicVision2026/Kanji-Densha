# Open questions

Rules: the implementer never resolves an entry here silently. Either the architect answers,
or the entry blocks the milestone named in it. Resolved entries move to `docs/decisions.md`
and become numbered clauses in `docs/spec/mastery-rules.md`.

As of 2026-08-25, Q1–Q13, Q15, and Q16 are resolved — see `docs/decisions.md` and the Resolved
section below. **Nothing open blocks any milestone.** One budget question remains (Q14).

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

**Q15 — 山's shape lamp in M3. CONFIRMED 2026-08-25.** The architect confirmed the M3 stub
(watch strokes in order, one button, real `answer` event lights the lamp — not a stroke-order
*test*, since it cannot be answered wrong) as the right call for M3, to be thrown away rather
than extended when M4 designs the real interaction. One instruction attached: because a child
cannot fail this step, it carries no signal, so `docs/m3-observation-protocol.md` explicitly
excludes it from the observation notes — reading meaning into it would corrupt the notes M4
gets designed from.

**Q16 — no path back to わかる when a wrong answer forces reteach mid-ためす. FIXED
2026-08-25.** Was raised as a "does not block M3" limitation; the architect corrected that
call — `forceReteachOnWrong: true` at Grade 1 is the architect's own parameter ("at six,
re-meeting the character costs nothing and carries no shame"), so a ride with no way back from
a single wrong answer contradicts the decision it's supposed to implement, and a six-year-old
getting one wrong is the median session, not an edge case — this blocked the child session.

Fixed in the Q16 follow-up PR: on a counted wrong that clears `understood` (MR-4.6),
`Practice.tsx` detours to わかる — reusing `Understand.tsx` with a `reteach` framing
(「もういちど みてみよう」, `// COPY-REVIEW`) — and resumes ためす on the *same* item once the
child re-confirms via a real `understand` event (MR-3.2), rather than restarting items already
answered correctly. `apps/web/e2e/ride.spec.ts` covers wrong → reteach → correct → だいたい.
