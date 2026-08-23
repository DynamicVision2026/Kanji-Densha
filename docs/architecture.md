# Architecture — 漢字でんしゃ

Companion to `docs/spec/product-spec.md`. The spec says *what*. This says *where it lives
and what shape it has*.

**The mastery state machine is specified normatively in `docs/spec/mastery-rules.md`, which
governs the engine.** This document gives the shape; that document gives the rules. Where
either is silent, the product spec governs; where all three are silent,
`docs/open-questions.md` governs and the implementer asks.

## 0. The organising idea

Every rule in the spec that could be violated at runtime should instead be made
**impossible at build time or unrepresentable in the type system**. The QA list in spec §13
is mostly a list of rules that were enforced by discipline instead of by structure. We
invert that:

| Spec rule | Old enforcement | New enforcement |
|---|---|---|
| One item → one lamp | code review | `lamp` is a single-valued field in the schema |
| Published only | runtime filter | drafts never enter the shipped bundle |
| Elementary readings only | content care | reading items reference a reading id; gate resolves it against `elementary_readings` |
| Honest denominator | parent-page arithmetic | `teach_ready` baked into the bundle by the gate |
| No same-session perfect | conditional in UI | engine is the only writer of `status` |

---

## 1. `packages/engine` — the state machine

Zero dependencies. Pure. Total. Every function is `(input) => output`.

### 1.1 Domain types

```ts
export type Lamp = 'reading' | 'meaning' | 'shape';
export type Status = 'new' | 'lost' | 'fix' | 'almost' | 'perfect';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export interface CharacterProgress {
  readonly characterId: string;          // NFC kanji
  readonly status: Status;               // derived only (MR-1.1)
  readonly lamps: Readonly<Record<Lamp, boolean>>;
  readonly encountered: boolean;
  readonly understood: boolean;
  readonly repairs: readonly Lamp[];
  readonly lostFlag: boolean;
  readonly consecutiveWrong: Readonly<Record<Lamp, number>>;
  readonly lifetimeWrong: Readonly<Record<Lamp, number>>;
  readonly almostAt: number | null;
  readonly almostSessionId: string | null;
  readonly echoes: readonly EchoAttempt[];
  readonly openEcho: OpenEcho | null;    // engine-owned echo round (MR-1.3)
  readonly seenSurfaces: readonly string[];
  readonly novelFailures: readonly string[]; // surfaces that spent the U2 exemption (MR-4.3)
  readonly stampedAt: number | null;
}

export interface EchoAttempt { readonly at: number; readonly ok: boolean; readonly sessionId: string; }

export interface OpenEcho {
  readonly startedAt: number;
  readonly sessionId: string;
  readonly results: Readonly<Partial<Record<Lamp, boolean>>>;
}
```

### 1.2 Events

```ts
export type ProgressEvent =
  | { type: 'encounter';  at: number; sessionId: string }
  | { type: 'understand'; at: number; sessionId: string }
  | { type: 'answer';
      at: number; sessionId: string;
      itemId: string;
      lamp: Lamp;                 // exactly one — I1
      correct: boolean;
      mode: 'practice' | 'echo';
      surfaceId: string | null;
      soft: boolean };            // 似た駅名 etc: repairs, never lights, never counts toward lost
```

There is deliberately no `novelSurface` field and no `echo_result` event. Novelty is derived
by the engine from `seenSurfaces` / `novelFailures`, and echo rounds are closed by the engine
from the answers themselves (MR-1.2, MR-1.3). A caller must not be able to assert either.

Not events (never reach the engine): in-car announcements, 音の家族工房 attempts,
audio playback, opening any parent page. These are unscored by design (spec §4, §6, §7, §10).

### 1.3 Grade parameters

Data, not constants. One row per grade, loaded from `content/params/grades.yaml`.
G3–G6 must not inherit G1 numbers by omission — the schema requires every field per grade.

```ts
export interface GradeParams {
  grade: Grade;
  sessionItemCap: number;
  itemsPerLamp: number;
  echoFirstDelayHours: number;      // e.g. 20 for G1–G3, 36 for G4–G6
  echoSecondDelayHours: number;     // ~168
  echoPerDayCap: number;
  lostConsecutiveWrong: number;     // e.g. 3 at G1
  lostLifetimeWrong: number;
  forceReteachOnWrong: boolean;
}
```

### 1.4 The contract

```ts
export function evaluateProgress(
  previous: CharacterProgress,
  event: ProgressEvent,
  params: GradeParams,
  requiredLamps: readonly Lamp[],   // from the character's published surfaces
): CharacterProgress;
```

`requiredLamps` is passed in, not derived, because it depends on whether a published
shape surface exists — a content fact, not a progress fact (spec §5.2).

The rules this function implements are numbered MR-1.1 … MR-7.8 in
`docs/spec/mastery-rules.md`. Implement against that document clause by clause; do not
reconstruct the state machine from the product spec prose.

### 1.5 Testing the engine

`packages/engine/fixtures/*.json`, each `{ name, requiredLamps, params, initial, events[], expect }`.
Fixtures are the rules made executable; add one per clause in `mastery-rules.md`, named after
the clause (`MR-6.3-failed-echo-preserves-almostAt.json`). Plus property tests:

- status never becomes `perfect` from an event stream containing fewer than two echoes
- no event sequence within a single `sessionId` produces `perfect`
- `soft: true` answers never increase `consecutiveWrong`
- the function is deterministic: same inputs, same output, no time or randomness

---

## 2. Content system

### 2.1 Source shape — `content/characters/<grade>/<kanji>.yaml`

One file per character. Human-readable, review-friendly, git-diffable.

```yaml
character: 山
grade: 1
elementary_readings:            # I4 — only these can light the reading lamp
  - id: san_on
    kana: サン
    type: on
    audio: audio/山/san.mp3
  - id: yama_kun
    kana: やま
    type: kun
    audio: audio/山/yama.mp3
later_readings: []              # middle/high — reference is a gate error
meaning:
  gloss_ja: たかく もりあがった ところ
  category: nature
encounter:
  art: art/山/encounter.webp     # or template: mountain-ink
  copy_ja: やまに のぼると、とおくまで みえるよ。
surfaces:                        # word platforms
  - id: yama_1
    word: 山
    reading_id: yama_kun
    audio: audio/surfaces/yama.mp3
  - id: fuji_1
    word: ふじ山
    reading_id: san_on
shape:
  kind: primitive                # primitive | compound
  strokes: [{ order: 1, type: tate, a11y_ja: 'たての ぼう' }, ...]
  published: true
items:
  - id: 山-r-1
    lamp: reading                # I1 — single value
    type: reading_choice
    reading_id: yama_kun
    ...
lines: [yama-no-sen]             # editorial only — never affects mastery
status: published                # draft | review | published
```

Rules the schema encodes:
- `lamp` is an enum, not an array
- a `reading_choice` item's `reading_id` must resolve inside `elementary_readings`
- a `meaning_choice` item's distractors must be tagged `semantic`; kana-reading distractors
  are a schema error (spec §6)
- `shape.kind: compound` forbids a free stroke list; it requires `components`
- `lines` membership is declared per character in `content/lines/*.yaml`, editorially.
  Containment is never inferred from components (spec §3: 校 ∉ 木の線)

### 2.2 The gate — `packages/content-build`

`pnpm content:build` runs: parse → schema validate → cross-reference → gate → emit.

Gate checks (all block the build):
1. every referenced audio file exists and is non-empty
2. every reading item resolves to an elementary reading
3. every item declares exactly one lamp
4. compound characters have components, primitives have strokes; stroke a11y names are
   unique within a character
5. at least one surface, and echo capability (a second surface, or a second sentence frame)
6. `teach_ready` computed per spec §8.1 and written into the bundle
7. anything not `status: published` is dropped from the output entirely (I2)

Emits `content-dist/g1.json … g6.json` plus `content-dist/manifest.json` carrying
`teach_ready` counts, content hash, and audio manifest.

The audio manifest is how I10 works: the UI renders a speaker only if the manifest has
the file. Missing audio is an honest omission, not a fallback.

### 2.3 The content factory (offline, LLM-assisted, human-gated)

Allowed: LLMs drafting encounter copy, meaning glosses, distractor candidates, and word
surfaces — into `status: draft`. Required: a human review step that flips `draft → published`.
Forbidden: any of this at runtime (I3). The factory is a separate CLI under
`packages/content-build/factory`, never imported by the app.

---

## 3. `packages/store` — persistence boundary

```ts
export interface ProgressStore {
  load(childId: string): Promise<Record<string, CharacterProgress>>;
  apply(childId: string, characterId: string, event: ProgressEvent): Promise<CharacterProgress>;
  listSessions?(childId: string): Promise<SessionSummary[]>;
}
```

Two implementations: `LocalStore` (localStorage, guest) and `RemoteStore` (Better Auth +
PGLite/Neon). Both call the same `evaluateProgress` (I5). `apply` is the only write path;
the UI never constructs a `CharacterProgress` by hand.

Guest → account migration is a one-way merge at sign-up: per character, take the higher
status; on ties keep the earlier `almostAt` so echo clocks are not reset. Spec this before
building it — it is the kind of thing that silently loses a child's week of progress.

---

## 4. `apps/web`

Route groups: `(child)` and `(parent)`. The parent group imports a read-only selector
module that has no access to `store.apply` (I8) — enforce by module boundary, not by care.

Session flow is a state machine mirroring the four beats, with the beat order enforced for
first-time states (spec §4). The echo scheduler is a separate module: given progress +
params + now, it returns which characters are echo-eligible today, respecting
`echoPerDayCap`. It never writes.

### Art direction (locked)

Ink-wash on 宣紙 ground, vermilion reserved for the locomotive and the current station only.
Five status colours must be distinguishable in greyscale and to a colour-blind parent —
pair every colour with a shape or label, never colour alone. Typography: a 教科書体-adjacent
face for the kanji itself; check licensing before committing (this was a Week-1 blocker on
the sibling project).

---

## 5. Licensing notes to resolve before shipping

- **KanjiVG is CC-BY-SA 3.0.** Using it as reference for stroke order and count is low risk;
  shipping derived path data may pull share-alike obligations onto the bundle. Recommended:
  keep KanjiVG-derived data in `content/shape/` with its own LICENSE file, ship product
  redraws, and credit on the parent page. Get this looked at properly before launch — this
  is a design note, not legal advice.
- **Kanji display font**: confirm a web/embedding licence before the visual identity locks.
- **Audio**: record the TTS vendor's licence terms for commercial redistribution of
  pre-rendered files in `docs/licenses.md`.
