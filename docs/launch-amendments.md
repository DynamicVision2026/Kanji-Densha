# Launch amendments — append to `docs/decisions.md`

Decided 2026-08-28 under the September 1 deadline. Add these rows to the register and the
corresponding notes below the table.

| ID | Decision | Rule |
|----|----------|------|
| **D21** | The content gate's `teach_ready` check is corrected to match spec §8.1 exactly: **fixed audio is required for the character's elementary readings, not for word surfaces.** Surfaces without audio render no speaker (I10) and remain `audio_pending` in the manifest. This is a gate defect fix, not a lowered bar — the gate was stricter than the specification it implements. | spec §8.1, I9, I10 |
| **D22** | **D19 is amended for the bulk import only.** `taught_readings` are derived mechanically: the readings used by at least one of that character's word surfaces, capped at three, ordered by surface count; the anchor is the reading of the first surface. `rationale` is set to the literal `[AUTO] derived from word surfaces` — never a sentence implying human judgment. Human curation follows after launch, Grade 1 first. | D19, M2 schema |
| **D23** | **The existing xAI TTS audio is retained.** D16's move to VOICEVOX was a forward-looking vendor choice for new generation, not a finding that the terms failed; the 2026-08-24 review cleared xAI on ownership, which covers files already generated. One consistent voice (`eve`) across all 1,121 files is the property that matters to a child. VOICEVOX remains the engine for any *future* generation, including word-surface audio. | D16 |
| **D24** | Audio review is right-sized to what the payload actually is. All 1,121 files are **citation readings**, which D16 judges for clarity and neutrality rather than accent; word-surface audio, the accent-critical category, does not exist yet. With furigana displayed on screen as the visual source of truth, the check is **~40 files sampled across all six grades, verified to say the correct kana clearly.** Any grade whose sample fails ships with speakers hidden. | D16, I10 |
| **D25** | The five Grade-4 prefecture characters (媛・岐・滋・阪・辺) are corrected to `proper_name` reading type rather than dropped. The schema already has this path from M2's appendix handling. | M2 schema |
| **D26** | **学 ships with its real compound shape data** (⺍+子). The unpublished-shape record was a test artifact proving the honest-omission path; that proof moves to a fixture in `bad-content/`, and the product gets real data. | D4 |

## Notes

**On D21.** Verify against spec §8.1 before changing anything. If §8.1 genuinely requires
surface audio, stop and escalate — do not apply this. If it does not, correct the gate to match
the spec *exactly*, not one notch looser, and add a test asserting the corrected rule so the
next person cannot re-tighten or re-loosen it by accident.

**On D22.** This is a recorded amendment, not a silent violation. The whole point of D19 was
that a thousand invisible judgment calls are a liability; a mechanical rule with an honest
`[AUTO]` marker is visible and reversible, which a fabricated rationale would not be. Every
`[AUTO]` string is a grep-able queue of work for after launch.

**On D24.** The furigana observation is what makes this sizing honest rather than a
concession: furigana conveys which morae, so a wrong *reading* is caught on screen regardless
of the audio. What furigana cannot convey is pitch accent — which is why word-surface audio,
when it is eventually generated, returns to full accent review under D16 unchanged.

## Still governing, unchanged under the deadline

One engine. Published-only content on the child path. Honest `teach_ready` denominators —
partial and true beats complete and false. No runtime LLM on the child path. `sessionId`
threaded through every event, because I7 must hold structurally rather than as an accident of
parameter values.
