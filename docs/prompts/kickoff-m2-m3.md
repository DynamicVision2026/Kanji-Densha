# Claude Code kickoff prompts — M2 and M3

**Firing order.** One milestone per Claude Code session. Start a new session (`/clear`) for
each, so the model re-reads the repo state rather than trusting its memory of what it wrote
an hour ago. Do not paste M2 until M1 is merged; do not paste M3 until M2 is merged. The
prompts exist early so you are never waiting on me, not so they can be queued.

**Q13 is answered:** no content records, no audio, no art. But the four national reference
documents now sit in the repo, and they change M2 — read `docs/reference/README.md` and
decisions D13–D15 before starting. M2 gains a Part 0 below.

---

## M2 prompt — content schema, gate, and twenty characters

> Read `CLAUDE.md`, `docs/decisions.md`, `docs/architecture.md` §2, and product spec §6 and
> §8 before writing anything. Implement **M2 only**. Branch `m2-content-gate`. No UI —
> `apps/web` stays as the M0 placeholder.
>
> **Part 0 — reference data.** Ingest `mext_onkun_school_stage_assignments_2017.xlsx` into
> `content/reference/onkun-stage.json`, preserving every provenance column (source page,
> confidence, source URL) and recording the source file's hash. Accept `special` and
> `proper_name` as reading types for the two appendix sheets. Write a validation test that
> asserts what I already verified by hand, so a corrupted re-ingest is caught: 2,136 unique
> kanji; 1,026 carrying an elementary grade; per-grade counts of exactly
> 80 / 160 / 200 / 202 / 193 / 191. Never hand-edit the generated JSON.
>
> This file is now the gate's authority for invariant I4, which changes the schema: a
> character's `elementary_readings` and `later_readings` are **generated** from the reference
> table by grade, not typed by an author. What the author supplies instead is
> `taught_readings` (D14) — the curated subset the reading lamp will actually test. The gate
> verifies `taught_readings` is a strict subset of the character's elementary readings and
> fails, naming the offending reading, when it is not. 生 is the reason this field exists: it
> has ten elementary readings, and no child lamp can test ten.
>
> **Part 1 — schema.** Build `packages/content-schema` as Zod schemas matching
> `architecture.md` §2.1 exactly. The schema, not a later runtime check, is what enforces:
> `lamp` is a single enum value and never an array (I1); `later_readings` exists as a field
> but no item may reference it (I4); `shape.kind: compound` requires `components` and
> forbids a raw stroke list; meaning-item distractors carry a `semantic` tag and kana-reading
> distractors are a parse error; every kanji string is NFC-normalised at the boundary.
> Make the illegal record unparseable before you make it tested.
>
> **Part 2 — gate.** Build `packages/content-build` as a CLI, `pnpm content:build`, running
> parse → validate → cross-reference → gate → emit. Implement all seven gate checks in
> `architecture.md` §2.2. Two of them are the ones that will actually catch mistakes in
> practice, so give them real error messages naming the file and field: every referenced
> audio file exists and is non-empty, and every reading item resolves to an entry in that
> character's `elementary_readings`.
>
> `teach_ready` is computed by the gate per spec §8.1 and written into
> `content-dist/manifest.json` along with a content hash and the audio manifest. Nothing with
> `status` other than `published` appears anywhere in the output — not filtered at read time,
> absent from the file (I2).
>
> **Part 3 — twenty Grade-1 characters,** hand-authored, with real audio files. Use exactly
> this set, chosen to stress every branch of the schema:
>
> 一 山 川 木 林 森 日 月 火 水 田 男 力 人 大 犬 本 目 生 学
>
> What each group is testing, so you can tell when a record is wrong rather than merely
> parseable:
> - **一** — minimal primitive, single stroke, the degenerate case
> - **木 / 林 / 森 / 本** — one line family: a primitive, two compounds of it, and a
>   form-in-context character. 林 must be `components: [木, 木]`, never an eight-stroke split
> - **男** — compound of 田 and 力, both of which are also in this set: exercises
>   cross-referencing between records
> - **日 / 生** — maximum reading complexity. 生 has ten elementary readings plus おう and き
>   at junior high; 日 has four, all elementary. Both exercise `taught_readings`: pick two or
>   three for 生 and say in the PR why those. Confirm the gate rejects an item referencing
>   おう. If this pair passes cleanly, I4 is real
> - **川 / 目 / 火** — the reference table says 川 has exactly one elementary reading (かわ;
>   セン is junior high), 目 carries ボク at junior high and ま at high school, and 火 carries
>   ほ at high school. 川 is the D15 case: its echo must vary the word surface, not the
>   reading. Do not author around this — author it as it is
> - **日 / 目** and **大 / 犬** — confusable pairs, for 似た駅名 soft items later. Author them
>   as normal characters now; just make sure the meaning distractors are semantic and not
>   "the other one that looks similar"
> - **学** — abstract meaning and a complex shape. Deliberately leave `shape.published: false`
>   on this one. It must still reach `teach_ready`, and it must produce no shape item and no
>   apology copy (D4). This is the character that proves the honest-omission path
>
> **Part 4 — the rejection suite.** `fixtures/bad-content/`, one deliberately invalid record
> per gate rule and per schema constraint above, each with a test asserting it is rejected
> and asserting *which* error fires. A gate that rejects for the wrong reason is a gate that
> will pass the wrong record later.
>
> **Exit criteria.** `pnpm content:build` emits `content-dist/g1.json` and a manifest
> reporting `teach_ready: 20` against a G1 denominator of 80. Deleting one audio file makes
> the build fail with a message naming that file. Every fixture in `bad-content/` is
> rejected. And: adding a twenty-first character requires no code change — say so in the PR
> and show the diff that would be needed.
>
> Do not write the LLM content factory in this milestone. Twenty records authored by hand
> first, so the factory automates a process we have actually felt the cost of.

---

## M3 prompt — the vertical slice

> Read `CLAUDE.md`, `docs/spec/mastery-rules.md` §3 and §7, `docs/architecture.md` §3 and §4,
> and product spec §4 and §7. Implement **M3 only**. Branch `m3-vertical-slice`.
> Guest mode only — no auth, no parent surface, no route map, no echo scheduling.
>
> Build `packages/store` with the `ProgressStore` interface and the `LocalStore`
> localStorage adapter, then `apps/web` as a TanStack Start app delivering the four beats for
> a single character on a phone: 出会う → わかる → ためす → 到着.
>
> Rules that are not negotiable in the UI layer:
> - `store.apply` is the only write path. The UI never constructs a `CharacterProgress` and
>   never computes a status. If you find yourself wanting to know the status before the
>   engine returns it, that is the bug (I5)
> - Beat order is enforced for a first-time character. Encounter and Understand are
>   unscored and emit no answer events
> - Speakers render only when the audio manifest has the file, play only on user gesture
>   (iOS Safari), are replayable, and stop the previous line when a new one starts. A missing
>   file hides the button — never a fallback, never a different reading (I10)
> - Touch targets ≥ 44px. No error state before the child has made any input
> - Japanese only on the child path. Mark any Japanese copy you invent `// COPY-REVIEW`
>
> The 到着 screen is the one that carries the product's whole philosophy, so write it
> carefully. It shows だいたい, it says plainly and warmly that かんぺき comes later after the
> train comes back, and it does not imply the child failed at anything. It must not show a
> percentage, a score, or a streak.
>
> Art direction is in `architecture.md` §4: ink-wash on a paper ground, vermilion reserved
> for the locomotive and the current station. Type is decided in `docs/licenses.md` (D11):
> self-host a subset of **Noto Sans JP**, and define **two** CSS custom properties —
> `--font-ui` and `--font-hero` — both pointing at it for now. The hero token exists so the
> large teaching glyph can be swapped for a 教科書体 later without touching anything else
> (Q14). Add the OFL attribution row to the credits data now, not at release.
>
> Tests: Playwright covering one happy path through all four beats, plus a test asserting
> that a completed session leaves the character at `almost` and never `perfect`, however many
> items are answered correctly (I7). Plus an axe accessibility pass on each beat.
>
> **Exit criteria.** A child rides 山 start to finish on a real phone without an adult
> translating the UI. Post the storage state after the session in the PR so I can read the
> `CharacterProgress` the engine actually produced.

---

## After M3

Do not write M4 as a prompt until M3 has been in a child's hands. The shape system is the
most expensive milestone in the plan and the most likely to be redesigned by four minutes of
watching someone six years old try to tap strokes in order. Bring me what you observe and we
will write M4 against that rather than against the specification.
