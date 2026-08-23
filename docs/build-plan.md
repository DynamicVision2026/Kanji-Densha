# Build plan — 漢字でんしゃ

## 0. Sequencing logic

Two tracks run in parallel after M2.

**App track** is built engine-first. The mastery state machine and the content gate are
where the product's credibility lives; the UI is the replaceable part. Building UI first
would mean discovering the engine's edge cases through screenshots, which is how "one item
lit all three lamps" ships.

**Content track** is the actual size of this project: 1,026 characters × (readings + audio +
meaning + ≥2 word surfaces + items + shape data + encounter art and copy). It is a factory,
not a milestone. It starts as soon as the gate exists and ships **grade by grade** — G1
complete and honest beats 1,026 half-done, because the parent-facing denominator is
`teach_ready` and a truthful 80/80 is a better sale than a hollow 1,026.

Ship gate for a public pilot: **M0–M4 plus G1 content complete.** Everything after that is
widening, not unblocking.

---

## M0 — Skeleton and enforcement

Nothing product-visible. This milestone exists so that the invariants in CLAUDE.md are
enforced by CI from the first commit rather than retrofitted.

**Deliverables**
- pnpm monorepo, TS strict, the package layout from `architecture.md` §0
- CI: typecheck, lint, test, `content:build`
- Boundary lint rules: `apps/web` cannot import `content/`; `packages/engine` has an empty
  `dependencies` block and a CI grep gate rejecting `Date.`, `Math.random`, `fetch` in its src
- `docs/open-questions.md` present and wired into the PR template

**Exit criteria** — a deliberately-broken PR (engine importing lodash, web importing
`content/`) fails CI locally. Demonstrate it, don't assert it.

---

## M1 — Engine v1

**Deliverables**
- All types, events, and `evaluateProgress` per `architecture.md` §1
- `content/params/grades.yaml` with all six grades fully specified
- Fixture suite: one fixture per spec clause in §5, named after the clause
- Property tests from §1.5

**Exit criteria**
- 100% branch coverage on `evaluateProgress` (this one function, not the repo)
- Every open question in the register is either answered or has its chosen default
  recorded in a fixture named `ASSUMED-*` so the assumptions are greppable
- No UI exists yet. If you built UI in M1, you went off-plan.

---

## M2 — Content schema, gate, and 20 characters

**Deliverables**
- Zod schemas + gate per `architecture.md` §2
- `pnpm content:build` emitting `content-dist/g1.json` + manifest
- 20 Grade-1 characters authored end-to-end by hand, including real audio files
- A `fixtures/bad-content/` directory of deliberately invalid records, one per gate rule,
  with a test asserting each is rejected

**Exit criteria**
- Manifest reports `teach_ready: 20` for G1 and the gate refuses to count a character whose
  audio file is missing
- Authoring the 21st character requires no code change

The 20 are hand-authored deliberately. Do not build the LLM content factory until a human
has felt what a good record costs — the factory should automate a known-good process, not
invent one.

---

## M3 — Vertical slice: one ride

**Deliverables**
- Guest mode, `LocalStore`, the four beats for a single character, on a phone
- Speaker buttons wired to the audio manifest, replayable, gesture-triggered
- 到着 screen showing だいたい and saying honestly that かんぺき comes later

**Exit criteria** — a real child rides 山 on a real phone start to finish without an adult
translating the UI. Status after the session is `almost`, never `perfect`. Watch one child
do it before you call this done; you will learn more in four minutes than from the test suite.

---

## M4 — Shape system

**Deliverables**
- Stroke-order tap-to-select (primitives) with unique a11y names per stroke and a
  next-stroke hint
- Component assembly (compounds) — never a free stroke split
- 選字填空 cloze
- `published_shape` gate behaviour: unpublished shape ⇒ shape not required, no shape item,
  no apology copy

**Exit criteria** — a character with three identical よこ strokes is completable by
screen reader; no red state appears before first input.

---

## M5 — Echo, timetable, map, stamps

**Deliverables**
- Echo scheduler (pure, `now` injected) honouring both delays and `echoPerDayCap`
- Surface variation: prefer a different word, else same word new frame
- Timetable + route map, editorial lines, 未開通 stations non-navigating
- Stamp book on first `perfect`

**Exit criteria** — a fixture-driven test advances a virtual clock through 20h and 168h and
lands exactly one character on `perfect`, with the stamp granted once. This is the test that
proves the whole product thesis; give it a name and put it in the README.

---

## M6 — Parent surface

**Deliverables**
- Read-only status counts, weekly activity, attention list, ≤5-character paper list
- Role copy in JA and EN: app = reading/meaning/form-selection; paper and school = writing
- Denominators from `manifest.teach_ready` (I9)
- Licence credits page

**Exit criteria** — opening every parent route with a network recorder shows zero writes.

---

## M7 — Auth and sync

Better Auth + PGLite/Neon, `RemoteStore`, and the guest→account merge rule. Do not start
before M5: the merge rule is only definable once echo timestamps matter.

---

## Content track (parallel, from M2)

| Wave | Scope | Gate |
|---|---|---|
| C1 | G1 80 characters | pilot-ready |
| C2 | G2 160 | second grade launch |
| C3 | G3 200 | the "Grade 3 wall" — expect the hardest content review |
| C4 | G4–G6 586 | scale |

Per wave: LLM drafts → human review → `published`. Track cost per character in hours after
wave C1 and re-plan; the honest number will not be the one estimated now.

**Reuse check before authoring anything:** the 音訓割り振り表 elementary-stage reading table
built for the sibling juku project is exactly the asset I4 depends on. Copy it in as
repo-owned data with provenance recorded. Copy, not a dependency — the two products stay
independent.

---

## Definition of done for one character (spec §14, operationalised)

Gate-checkable: encounter art + copy, elementary readings with audio, meaning content,
≥2 surfaces or a second frame, shape published or explicitly not required, items with
one lamp each, all references resolving. When those pass, `teach_ready` flips and the
character enters the denominator. Nothing else counts.
