# Repo harvest plan

Supersedes the consolidation audit. Written 2026-08-26 against Claude Code's audit of
`Dynamic-Densha`. `Kanji-Densha` is the trunk. `Dynamic-Densha` is harvested for plumbing and
then archived — it is not merged.

---

## What the audit found, and why it settles the question

Two independent mastery models existed, and the second had drifted in ways that change what
かんぺき *means* — not parameter differences, different mechanics:

- **Decay code exists.** `perfect` regresses to `almost` purely from elapsed time. D8 says
  status never changes from the passage of time alone. Currently disabled in all six grade
  configs — which is worse, not better. Dormant code implementing a forbidden behaviour reads
  to the next engineer as a finished feature awaiting a flag.
- **かんぺき is immune to wrong answers there**, and the only route down is that decay. Ours
  is the exact inverse (MR-7.7): wrong answers regress, time never does.
- **A failed second echo erases the first.** A child who passes echo 1 and fails echo 2
  restarts the whole two-echo sequence. D2 exists precisely so one wrong tap cannot cost a
  seven-year-old their week.
- **No echo rounds at all** — a single correct answer with all lamps incidentally lit counts
  as an echo. No MR-6.1/6.2 equivalent.
- **I7 is parameter-dependent rather than structural.** `sessionId` is captured in
  `practice_events` but never reaches the scoring function, so same-session かんぺき is
  prevented only by the delays being nonzero. That is exactly the class of gap I7 was written
  to close by construction.
- **Reteach routing lives in the UI**, reading raw state fields — I5 inverted.
- **`かんぺき` can be constructed two structurally different ways**: through the evaluator, or
  as a hand-written object literal in the demo seed.

This is not code that needs reconciling. It is a second answer to the question the product
exists to answer, and the harvest deletes it.

## The principle

**Code that encodes a rule must have exactly one implementation. Everything else is ordinary
code, adapted on its merits.**

Rules are singular: the mastery model, the content gate, the reference authority. Rendering,
persistence, routing, and plumbing are not — they are judged on quality like any other code,
and good code is kept.

An earlier draft of this plan applied "delete" far beyond what that principle supports. The
list below is corrected.

## Harvest — take these

| Item | Why |
|---|---|
| **i18n catalogues** — ja / en / zh-Hans / zh-Hant, ~348 keys, non-ja locales typed against the ja block so a missing key is a compile error | Expensive to redo and the parity enforcement is a genuinely good pattern. **Scrub before import:** `messages.ts:606` still claims readings use fixed xAI TTS files — withdrawn by D16. Audit every key for status vocabulary and any claim about how the product works. |
| **Cloud Run preview workflow** — manual dispatch, `--no-traffic` tagged revision, `GCP_SA_KEY` via `google-github-actions/auth` | Correctly built, no hardcoded credential, and a no-traffic tagged preview is exactly the mechanism for "nothing ships until the preview is signed." |
| **Better Auth tables** (migration 0001) and the auth wiring in `src/lib/auth/*` | Stock schema, no product logic. |
| **Downstream status consumers** — `parent-report.ts`, `weekly-plan.ts`, `stamps.ts`, `route-map.tsx` | These *read* status, they do not decide it. Ordinary code, and the parent report in particular encodes real product thinking we would otherwise rebuild from prose. Adapt to `CharacterProgress`. |
| **`src/lib/server/progress.ts`** | Persistence layer. Repointing it at the real engine is a targeted change, not a rewrite. |
| **`practice_events` schema** | Well designed — append-only, carries `session_id`. Keep. |
| **PWA middleware** | Plumbing. Evaluate on merit. |

**Condition on everything harvested that ships with tests:** read every assertion against
`docs/spec/mastery-rules.md` before it lands. Green tests encoding drifted rules are worse
than no tests, because the next person trusts them.

## Delete — do not port

**`src/lib/progress-eval.ts` and its grade params.** Not because the code is poor — the audit
found it structurally sound, with several parameters matching ours exactly. Because **we
already own the correct version**, and "adjusting" theirs means fixing eight drift items in the
transition logic, adding `openEcho`, threading `sessionId` through, restoring the invariants,
and then re-earning 100% branch coverage and thirty-five clause-named fixtures. That is
rewriting our engine second-hand, in a codebase whose tests currently pass while asserting
rules we have decided against.

**`src/lib/demo-progress.ts` seeding** — かんぺき written as an object literal is a second
construction path for the product's most important word.

**Welcome and entrance components** — being redesigned against
`docs/design/welcome-screen.md` and the entrance decisions regardless, so porting buys nothing.

**`kanji_progress` as written** — revise its columns to match `CharacterProgress` (it lacks
`openEcho`, `novelFailures`, `lostFlag`, and stores `echo_success_count` rather than an echo
list). With no real rows this is cheap, ordinary migration work — *adapt*, not redesign.

## One thing to fix rather than inherit

`npm run build` = `vite build && npm run db:migrate`. **Migrations must not run at build
time.** A build that mutates a database means any preview build can migrate production, and a
failed migration breaks the build rather than the deploy. Separate them: build produces
artifacts, deploy runs migrations, and each fails independently.

## Existing user data — none. Wipe it.

**Confirmed 2026-08-26: no real users, no children's data. Internal test data only.** Wipe the
database rather than migrating or replaying it. The replay approach previously specified here
is withdrawn as unnecessary.

Worth recording why it would have worked, since the situation will recur once there are real
families: `practice_events` is append-only and carries `session_id`, and our
`evaluateProgress` is a pure fold over events — so correct state is always *derivable* by
replaying a child's event history through the real engine. That is the payoff for keeping the
engine pure and clock-free. Preserve that property; it is the difference between a recoverable
data incident and an unrecoverable one.

**Credential note:** the secret exposed in the public history has been rotated and replaced.
Closed.

## Knowledge worth keeping, code worth leaving

Their UI provides the mid-session reteach recovery that our own Q16 found missing. Do not port
the mechanism — it computes routing from raw state in the UI layer, which is what I5 forbids —
but read it as a reference when building the Q16 fix. Someone already solved the interaction;
we need the same interaction driven by an engine signal.

## Order of work

1. Confirm whether real user rows exist.
2. Harvest the three approved items, each as its own PR, each arriving under the constitution.
3. Rewrite the entrance against the spec in `Kanji-Densha`.
4. Archive `Dynamic-Densha` read-only. Do not leave two deployable repositories.
