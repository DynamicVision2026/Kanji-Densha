# Open questions

Rules: the implementer never resolves an entry here silently. Either the architect answers,
or the entry blocks the milestone named in it. Resolved entries move to `docs/decisions.md`
and become numbered clauses in `docs/spec/mastery-rules.md`.

As of 2026-08-23, Q1–Q10 and Q12 are resolved and locked — see `docs/decisions.md`.
Two items remain.

---

**Q11 — Kanji display font and licence. Blocks the M3 visual identity lock.**
Which typeface renders the character itself on the child path, and does it carry a
web-embedding or server-subsetting licence for commercial use? A 教科書体-adjacent face is
the pedagogically correct choice and also the expensive one; the sibling juku project
treated the equivalent question as a Week-1 blocker with a reserved annual budget. The
fallback is a licensed general-purpose Japanese face for UI text plus a licensed or
self-drawn set for the large hero character only, which is a far smaller licence surface.
*No default. Architect to answer before M3 locks the visual identity.*

**Q13 — Pre-existing content outside the repository. Affects M2 shape, not M2 timing.**
The product specification header describes a build already at 1,026 `teach_ready` after a
content scale-out, W6 thicken, and a QA pass. The repository is empty, so no code migrates
(D10) — but content, audio, or encounter art may exist outside it. If it does, M2 becomes
"write an importer into the `content/` schema and audit what survives the gate" rather than
"hand-author 20 characters", and the content track collapses from four waves to one audit.
*Architect to confirm before M2 begins. M0 and M1 are unaffected either way.*
