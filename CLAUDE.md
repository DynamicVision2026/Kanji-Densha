# CLAUDE.md — 漢字でんしゃ / Kanji Densha

You are the implementer on this repo. The user is the architect and strategic designer.
Read this file completely before your first edit in any session.

Source of truth, in order:
1. `docs/spec/product-spec.md` (the product specification — do not edit it)
2. `docs/architecture.md` (module boundaries, schemas, engine contract)
3. `docs/build-plan.md` (milestones, exit criteria, open questions)
4. This file (how to work)

If these conflict, stop and ask. Do not resolve the conflict yourself.

---

## 1. What this product is

A Web/PWA that teaches the 1,026 MEXT 教育漢字 to Japanese elementary children.
One kanji = one train station/car. Learning-first, not clearance-first.
Thin question bank, thick teaching.

It is **not**: a handwriting grader, a drill farm, a native app, a leaderboard, or an
LLM tutor. See spec §1.4 for the full non-goals list.

---

## 2. Invariants — never violate, never "improve"

These are product-defining. A change request that breaks one is an escalation, not a task.

| # | Invariant |
|---|-----------|
| I1 | **One published item lights exactly one lamp.** The item schema has a single `lamp` field. Never an array. |
| I2 | **Published-only on the child path.** Drafts are excluded at build time and physically absent from the shipped bundle. |
| I3 | **No live LLM, no network inference, no runtime kanji decomposition on the child path.** LLMs may be used offline, in the content factory, with a human gate. |
| I4 | **Only elementary-stage 音訓 light the reading lamp.** Middle/high readings live in a separate field and can never be referenced by a reading item. |
| I5 | **`evaluateProgress` is the only status algorithm.** UI, parent views, and tests must not recompute status. Same function for guest and authenticated. |
| I6 | **The engine is pure.** No `Date.now()`, no `Math.random()`, no I/O, no imports outside the engine package. Time arrives inside the event. |
| I7 | **Same session never grants かんぺき.** `perfect` requires two spaced 残響 in later sessions. |
| I8 | **Parent surfaces are read-only.** Rendering a parent page must not emit a progress event. |
| I9 | **Honest denominators.** Grade progress uses `teach_ready` counts computed by the content gate, never 80/160/200 constants. |
| I10 | **Missing audio hides the speaker.** Never substitute a different reading, never fall back to live TTS. |

If you cannot implement a task without breaking one of these, stop and write the
conflict into `docs/open-questions.md`, then ask.

---

## 3. Repo layout and import boundaries

```
packages/
  engine/          pure state machine. Zero runtime dependencies.
  content-schema/  Zod schemas + the gate rules + teach_ready computation
  content-build/   CLI: validate -> gate -> emit published bundles
  store/           ProgressStore interface + localStorage and DB adapters
apps/
  web/             TanStack Start + React + Tailwind
content/           human-authored source data (YAML). Not shipped.
content-dist/      generated published bundles. Shipped. Never hand-edited.
docs/
```

Enforced boundaries (CI fails, not a review comment):

- `apps/web` may **not** import from `content/`. Only `content-dist/`.
- `packages/engine` may **not** import from anything except its own files.
- Nothing may import from `packages/content-build` at runtime.
- `content-dist/` is generated; a diff there without a matching `content/` diff fails CI.

---

## 4. Working protocol

- **One milestone per branch.** Branch name `m<N>-<slug>`. Do not start M+1 work inside M.
- **Escalate, don't invent.** Any spec ambiguity → append to `docs/open-questions.md`
  with the options you considered, then ask in chat. Never pick silently and move on.
- **No new dependencies without approval.** Name the package, the alternative, and why
  the alternative loses. `packages/engine` stays at zero deps permanently.
- **Tests before UI.** Engine and gate logic ship with fixtures. UI ships with at least
  one Playwright path per beat.
- **Every PR description states:** which milestone, which exit criteria it closes, and
  which invariant it came closest to breaking.
- **Independent review.** The architect reviews before merge. Write PR
  descriptions for a reviewer who has not read the conversation.
- **Don't touch content data to make a test pass.** If the gate rejects a character,
  the character is wrong or the gate is wrong. Say which.

---

## 5. Code conventions

- TypeScript strict, `noUncheckedIndexedAccess` on. No `any`, no non-null `!`.
- **Coverage is never satisfied by deleting a guard or widening a type.** If a branch is
  genuinely unreachable, express it as an `invariant()` and say which clause makes it
  unreachable — do not remove the guard, and do not cast the value present. The metric
  serves the engine, never the reverse.
- Domain types live in `packages/engine`. Nothing re-declares `Status` or `Lamp`.
- Make illegal states unrepresentable before you make them tested. Prefer a narrower
  type or a schema constraint over a runtime check plus a unit test.
- Kanji strings are NFC-normalised at the schema boundary. Never compare unnormalised.
- **Testing NFC normalisation:** editing tools normalise Japanese literals in flight, so a
  decomposed character pasted into source becomes composed before it's ever saved — a test
  meant to exercise NFC normalisation silently exercises nothing. Build the decomposed string
  from explicit code points (`String.fromCharCode(0x304b, 0x3099)`, not a literal) so the
  input the test starts from is verifiably still decomposed. This is a real environmental
  constraint, not a one-off — expect to hit it again.
- **Enforcement gates and tooling must be demonstrated against representative data** — kanji
  filenames, kanji content, non-ASCII paths — never ASCII stand-ins. A gate proven on
  `test.txt` is not proven. When adding a gate, the demonstration uses the data the gate will
  actually see in production. (M0's content-dist-drift gate was demonstrated correctly and was
  still broken for three milestones: git octal-escapes non-ASCII filenames by default, and the
  gate's `content/` prefix match silently never saw a single one of them until M2's kanji
  filenames exposed it. The demonstration was real; the data wasn't.)
- Default UI language is Japanese. English strings exist only where the spec says
  parent-critical. No English fallback text on the child path.
- Child-path copy is written for a 6-year-old: kana-first, short, no imperative scolding.
  If you are inventing Japanese child copy, mark it `// COPY-REVIEW` for native review.

---

## 6. Accessibility and device reality

- Every stroke/component choice needs a unique accessible name. Multiple よこ strokes
  must not produce three identically-named targets (this was a shipped bug — do not
  reintroduce it).
- Audio plays only on user gesture (iOS Safari). No autoplay on encounter.
- Targets ≥ 44px. The primary child device is a phone in a parent's hand.
- Never show a red error state before the child has made any input.

---

## 7. When you are unsure

Ask. A blocked milestone costs a day. A silently invented mastery rule costs the
product's credibility with parents, which is the only thing this product sells.
