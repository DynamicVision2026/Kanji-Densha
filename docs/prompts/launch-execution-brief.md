# Execution brief — gate, content, engine swap

Deadline September 1. Read `docs/launch-amendments.md` (D21–D26), `docs/launch-sept1.md`, and
`docs/reviews/repo-harvest-plan.md` before starting.

---

## Hard constraint — `Dynamic-Densha` is read-only, permanently

Founder mandate, 2026-08-28. It is an **archive**, not a working repository.

- Clone it read-only, outside this repo. `git clone --depth=1` is enough.
- **No commits, no branches, no pushes, no deletions, no file modifications** — not even a
  `.gitignore` tweak, not even to make a script run.
- Do not `register_repo_root` on it. Do not let its `AGENTS.md` load into a session.
- Before you finish, run `git status` and `git log origin/main..` in that clone and paste the
  output in your report as proof nothing was written.

**Consequence, and it changes step 3.** The engine swap cannot happen inside `Dynamic-Densha`.
The application is harvested **into** `Kanji-Densha`, the swap happens here, and deployment runs
from here. One repository, under the constitution, with the gates. `Dynamic-Densha` is archived
and never written to again.

---

## Step 1 — Gate correction (D21). Do this first; everything is sequenced behind it.

Read spec §8.1 and check what it actually requires. Its checklist says fixed audio for the
character's **elementary readings**; word surfaces appear separately, with echo capability and
no audio requirement attached.

- **If §8.1 requires surface audio:** stop and escalate. Do not apply D21.
- **If it does not:** the gate is stricter than the spec it implements. Correct it to match the
  spec *exactly* — not one notch looser. Add a test asserting the corrected rule so nobody can
  re-tighten or re-loosen it by accident.

Report the new `teach_ready`. Expect roughly 1,021/1,026. **Report this number before
continuing** — the launch plan is sequenced behind it.

## Step 2 — Content import

Import all 1,026 records converted to our schema.

- `taught_readings` derived per **D22**: readings used by at least one word surface, capped at
  three, ordered by surface count; anchor is the first surface's reading. `rationale` is the
  literal string `[AUTO] derived from word surfaces` — never a sentence implying human
  judgment.
- Five Grade-4 prefecture characters (媛・岐・滋・阪・辺) as `proper_name` (**D25**).
- 学 ships with its real compound shape data (**D26**); move the unpublished-shape proof to a
  fixture in `bad-content/`.
- Audio files copied in with their existing paths; record engine `xai-tts`, voice `eve`, and the
  absence of a generation manifest in `docs/licenses.md` (**D23**).
- Run the gate. Report pass rate by grade and every remaining failure grouped by rule.

**Do not modify the schema or the gate to raise the pass rate.** Anything that fails, fails.

## Step 3 — Harvest the app and swap the engine

Into `Kanji-Densha`, on branch `launch-app-harvest`.

1. Copy the application in: `src/`, `server/`, `migrations/`, `public/`, `vite.config.ts`, the
   Cloud Run workflow, `.env.example`. The existing M3 `apps/web` is superseded — keep its
   Playwright specs as reference, retire the rest.
2. **Delete `src/lib/progress-eval.ts` and its grade params.** Delete the `demo-progress.ts`
   かんぺき seed.
3. Wire `packages/engine` in as the single evaluator. Adapt the three call sites in
   `src/lib/server/progress.ts`.
4. **Thread `sessionId` through every event.** `completeEncounter` and `completeUnderstand`
   have none today. This is the largest piece of new work and it is not optional — I7 must hold
   by construction, not as an accident of the delay parameters being nonzero.
5. Thread `itemId` through — already in validated input, just never passed.
6. Revise `kanji_progress` columns to `CharacterProgress`: add `almostSessionId`, `lostFlag`,
   `novelFailures`, `openEcho`, `echoes` replacing `echo_success_count`. **Wipe the database** —
   it is dummy data (founder confirmed).
7. Rewire the existing reteach routing to key off `!understood` rather than
   `repairRequiredKinds.length`.
8. Add a catch for `EchoRejectedError`. The new engine throws where the old one silently
   degraded; an ineligible echo is a scheduler bug and must surface as telemetry, never as an
   error screen for a child.
9. Add the credits page attributions: xAI per the founder's standard credit line, the font,
   and KanjiVG for the stroke data.

## The August 30 fallback — decide it, don't discover it

If step 3.4 is not solid by end of day August 30, ship with `sessionId` threaded through
`submitPractice` only, and echo delays set generously so same-session かんぺき remains
impossible by parameter. That is what `Dynamic-Densha` relies on today, so it is not a
regression — but it **is** a debt. Record it in `docs/open-questions.md` as a numbered item
with a fix date, before launch, not after.

## Report back with

The corrected `teach_ready`, the pass rate by grade, remaining failures by rule, the state of
the `sessionId` threading, and the read-only proof from the archive clone.

## Unchanged under the deadline

One engine. Published-only on the child path. Honest `teach_ready` — partial and true beats
complete and false. No runtime LLM on the child path. And nothing ships to a public URL that
would tell a parent their child has reached かんぺき when the engine does not say so.
