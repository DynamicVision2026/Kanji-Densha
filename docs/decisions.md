# Decisions

Locked 2026-08-23 by the architect. Each entry was a spec ambiguity; each is now a rule.
To reverse one, edit this file, then the affected clauses in `docs/spec/mastery-rules.md`,
then the fixtures named after those clauses. Never reverse one in code alone.

| ID | Decision | Rule |
|----|----------|------|
| **D1** | The second 残響 is measured **from `almostAt`** (≈168h), with a floor of 48h after the first successful echo. | MR-5.3 |
| **D2** | A failed echo repairs the failed lamp and drops to なおし, **preserving `almostAt`**. It does not consume an echo slot and does not restart the week. | MR-6.3 |
| **D3** | まよい forces わかる again, clears `almostAt` and echo history, and keeps the stamp. Recovery path is まよい → なおし → だいたい. | MR-3.2, MR-4.5 |
| **D4** | `shape_required` is purely derived from `shape.published`. A character can always reach だいたい on the lamps it actually has. | MR-2.2 |
| **D5** | A repair is clearable in the same session by one correct answer on any surface. | MR-4.7 |
| **D6** | An echo requires both the time delay and a `sessionId` distinct from the almost-granting session and all prior echoes. | MR-5.4 |
| **D7** | One stamp per character, ever. `stampedAt` is write-once and survives every regression. | MR-7.6 |
| **D8** | No decay in v1. Status never changes from the passage of time alone. | MR-7.8 |
| **D9** | Soft items (似た駅名 and kin) can **repair** a lamp but never **light** one, and never count toward まよい. | MR-4.2, MR-4.3 |
| **D10** | Greenfield build, revised 2026-08-23: no content records or audio exist, but the four national reference documents do. M2 hand-authors 20 characters on top of an ingested reference corpus. | build-plan M2, `docs/reference/` |
| **D12** | The repository goes **private** before the first content commit. The corpus is the moat. | — |
| **D13** | The 2017 音訓割り振り表 (as the supplied xlsx) is ingested as repo-owned reference data and becomes the **gate's authority** for I4. `elementary_readings` and `later_readings` are generated from it per character, not authored. | `docs/reference/` |
| **D14** | A character declares a curated `taught_readings` subset of its elementary readings. The reading lamp tests only taught readings; the gate verifies the subset is a strict subset of what the reference table permits. Forced by 生, which has ten elementary readings — no child lamp can test ten. | new schema field, M2 |
| **D11** | Noto Sans JP (SIL OFL 1.1) for UI text. `--font-ui` and `--font-hero` are two separate CSS tokens; both point at Noto now. The shape lamp renders product vectors, not font glyphs, so it is unaffected. | `docs/licenses.md` |
| **D15** | Echo surface variation falls back to word-surface variation within a single reading when a character has only one elementary reading (川 has only かわ). Not an error, not an omission — a content fact the scheduler must handle. | MR-6.6, M5 |

Two engine-contract changes follow from D2 and D5, and supersede the original draft in
`architecture.md` §1:

- **Novelty is derived, not declared.** The `novelSurface` flag is removed from the event.
  The engine decides from `seenSurfaces` and `novelFailures` whether the U2 exemption
  applies, so a caller cannot claim an exemption it has not earned (MR-1.2).
- **The engine owns echo rounds.** There is no `echo_result` event. `openEcho` accumulates
  per-lamp results and the engine decides when a round closed and whether it passed, so the
  UI cannot report an outcome the answers do not support (MR-1.3, MR-6.1–6.2).

Both changes move authority from the caller to the pure function. That is the direction
authority should always move in this codebase.

| **D16** | *Revised 2026-08-26.* Pre-rendered fixed audio via **VOICEVOX + VOICEVOX Nemo**, generated locally, self-hosted; runtime generation prohibited on the child path. xAI TTS withdrawn. Resolved **for the 山 pilot only** — full Grade 1 generation stays blocked pending native-speaker review of the pilot. Word-surface audio is generated from the *word*, never the bare reading. | `docs/licenses.md`, MR-2.1, I10 |
| **D17** | KanjiVG as logic reference only; product redraw for anything shipped; derived material quarantined in `content/shape/` with its own LICENSE; attribution on the parent page. | `docs/licenses.md` |

| **D18** | `teach_ready` is never softened to let a milestone go green. M2 lands with `teach_ready: 0` and twenty characters listed `audio_pending`; the manifest gains a `pending` section naming the unmet checklist item and the file that would satisfy it. A gate that can only say yes is not a gate. | M2 exit criteria, I9 |

| **D19** | `taught_readings` gains a required one-line `rationale`, and each character declares an **anchor reading** — the taught reading that justifies its grade placement. The gate rejects a record whose `taught_readings` omits its anchor. Judgment at 1,026 characters must be recorded, not inferred. | M2 schema, `docs/reviews/m2-architect-review.md` |

| **D20** | On the welcome screen, a car once attached is never detached — regression from かんぺき leaves the train intact. Same logic as the write-once stamp (D7): a shrinking train punishes a child with an animation. Regression is surfaced on the timetable and the parent attention list instead. | `docs/reviews/welcome-screen-brief-review.md`, MR-7.7 |

**Still open:** Q14 (whether to license a 教科書体 for the hero character) — a budget
decision, not a build blocker, since it is one CSS token.
