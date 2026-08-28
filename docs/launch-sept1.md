# September 1 — four-day plan

Written 2026-08-28. Target: all 1,026 characters, all six grades, registration working, live
for the new school term.

---

## The inversion

`Kanji-Densha` has the correct engine, the content gate, the reference authority, and a
**one-character vertical slice**. It has no route map, no timetable, no echo scheduler, no
auth, no deploy — M5 and M7 were never built there.

`Dynamic-Densha` has the whole application. Route map, session flow, parent report, weekly
plan, stamps, Better Auth, migrations, a working deploy, four locales — and, per the founder,
the complete 1,026-character payload with audio.

**You cannot rebuild that application in four days. You can replace its engine in one.**

So invert the harvest. Do not move content into the new repo. Move the **engine** into the old
app:

1. Delete `src/lib/progress-eval.ts` and its grade params.
2. Drop in `packages/engine` — pure, zero-dependency, already 100% covered — as the single
   evaluator. Adapt `src/lib/server/progress.ts` to call it.
3. Delete the `demo-progress.ts` hand-written かんぺき seed.
4. Revise `kanji_progress` columns to match `CharacterProgress`. The database is dummy data —
   wipe it.
5. Run the content through the gate, fix what fails, ship the passing set.

That satisfies the one thing that was never negotiable — **one engine, correct rules** — while
launching on the only codebase that can serve six grades this week. Everything else about the
old repo can be brought under the constitution after the window.

The monorepo is not discarded. It becomes the source of the engine, the gate, and the
reference table, and the two repositories converge properly once the term has started.

## Four-day scope

**In:**
- Engine swap and seed deletion (above)
- Content extraction → gate → fix failures → ship
- Q16 reteach fix — small, and a ride that dead-ends on one wrong answer cannot go to children
- Entrance page and routing per the eighteen answered decisions
- Attribution on the parent credits page: `VOICEVOX:Nemo` verbatim, font, KanjiVG
- Static landing page, Japanese only, plain HTML

**Out, explicitly:**
- Payments. Launch free. This is now a virtue rather than a compromise.
- The moving switchback welcome animation. The entrance page ships; the diorama is M5.
- Porting gates into the old repo. Backport them the week after — they protect against drift
  over months, and there are four days.
- i18n beyond Japanese.
- Parent report beyond what already exists in the old app. It works; leave it.

## The two gates that survive a deadline, right-sized

I am cutting my own checks where I can. These two I am not, because both protect claims made
directly to parents, and a broken claim in launch week costs more than the window.

**Audio accent — sampled, not skipped.** Nobody has verified that 1,026 characters of
generated audio say the words correctly. Four thousand files cannot be reviewed in four days.
So: **full review of Grade 1 and Grade 2** — the youngest children, the highest volume, the
characters most likely to be a family's first impression — plus **twenty sampled files per
grade for 3–6**. If a grade's sample fails, that grade ships with speakers hidden (I10 makes
this safe and honest) and its audio follows in week two. A hidden speaker is a missing
feature. A confidently wrong reading is a broken promise.

**Gate failures ship as `audio_pending` or not at all.** The gate is the reason to trust this
content. Do not lower a threshold to raise a pass rate. If Grade 4 lands at 60%, Grade 4 ships
with 60% of its characters and an honest `teach_ready` denominator — which the parent report
was built to display truthfully. Partial and honest beats complete and false.

## Deferred, not cancelled

The child observation session. It was my gate and I am moving it: run it in week one, with
real families, on the live product. M4's shape system gets designed from it as planned — the
current placeholder is honest about being non-evaluative, and it does not block a launch.

## The realistic risk

The unknown is the gate pass rate, and it is knowable within hours. Get the extraction running
now; everything else in this plan is sequenced behind that number.

If the pass rate is high, this is achievable. If half the corpus fails, the honest move on
August 30 is to ship the grades that passed, with truthful denominators, and follow with the
rest — rather than to ship 1,026 characters whose readings nobody checked against MEXT's own
table.
