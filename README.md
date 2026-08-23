# 漢字でんしゃ / Kanji Densha

A Web / PWA that teaches the **1,026 MEXT 教育漢字** (学年別漢字配当表) to Japanese
elementary children. **One kanji = one train station / car.** Learning-first, not
clearance-first: a thin question bank and thick teaching.

> 「1026字を、列車に乗せて」— *1,026 kanji, one train at a time.*

**If you are opening this repo cold — human or model — read [`CLAUDE.md`](./CLAUDE.md)
first.** It is the constitution: the invariants, the working protocol, and the order
of the source-of-truth documents in [`docs/`](./docs). Do not edit
[`docs/spec/product-spec.md`](./docs/spec/product-spec.md).

## The vocabulary the whole product is built on

**Five statuses** (car colours) — a character is always in exactly one:

| Code | Japanese | Meaning |
|------|----------|---------|
| `new` | はじめて | Not yet substantially engaged |
| `lost` | まよい | Too many mistakes / lifetime threshold crossed |
| `fix` | なおし | Needs repair on specific lamp(s) |
| `almost` | だいたい | Required lamps lit; **the maximum a single session can grant** |
| `perfect` | かんぺき | Reached **only** after two spaced 残響 (echo) successes |

**Three lamps** — what a character can have lit:

| Lamp | Japanese | Earned by |
|------|----------|-----------|
| `reading` | よみ | Correct reading items (elementary 音・訓 only) |
| `meaning` | いみ | Correct meaning items (semantic) |
| `shape` | かたち | Correct shape items (stroke order / component assembly / 選字填空) |

The status is a pure derivation of the lamps and counters, computed by one function,
`evaluateProgress` in [`packages/engine`](./packages/engine). See
[`docs/spec/mastery-rules.md`](./docs/spec/mastery-rules.md).

The whole product thesis is one character's journey from `new` to `perfect` across two
spaced 残響. Two named integration fixtures walk it end to end and are the tests worth
reading first:

- **`THE-JOURNEY`** — `new` → だいたい → two spaced echoes → かんぺき, with exactly one stamp.
- **`THE-SETBACK`** — the second echo fails; the character sits at なおし with `almostAt`
  intact and no echo slot spent, re-lights the lamp next session, and reaches かんぺき
  **without waiting another week** (D2 / MR-6.3).

See [`packages/engine/fixtures/`](./packages/engine/fixtures) — one fixture per mastery
rule, each named after the clause it encodes.

## Repository layout

```
packages/
  engine/          pure state machine — zero dependencies, no clock, no I/O (I6)
  content-schema/  Zod schemas + gate rules + teach_ready computation
  content-build/   CLI: validate -> gate -> emit published bundles
  store/           ProgressStore interface + localStorage / DB adapters
apps/
  web/             TanStack Start + React + Tailwind
content/           human-authored source (YAML). Not shipped.
content-dist/      generated published bundles. Shipped. Never hand-edited.
docs/              the constitution (start with CLAUDE.md)
```

## Enforced boundaries (CI blocks the merge, not a review comment)

- `apps/web` may not import from `content/` or `packages/content-build`.
- `packages/engine` may not import any external module, Node builtin, or other
  workspace package — and carries no forbidden token (`Date.`, `Math.random`,
  `fetch`, …). Enforced by ESLint plus `scripts/check-engine-purity.mjs`.
- A change under `content-dist/` with no matching change under `content/` fails
  `scripts/check-content-dist-drift.mjs`.

## Develop

Requires Node ≥ 22 and pnpm.

```bash
pnpm install
pnpm verify   # typecheck + lint + engine-purity + test + content:build + drift gate
```

Individual gates: `pnpm typecheck`, `pnpm lint`, `pnpm check:engine-purity`,
`pnpm test`, `pnpm content:build`, `pnpm check:content-dist-drift`.

## Status

**M0 — skeleton and enforcement.** No product logic or UI yet; this milestone
exists so the invariants are enforced by CI from the first commit. See
[`docs/build-plan.md`](./docs/build-plan.md) for the milestone sequence.
