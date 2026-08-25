# Licence register

Every third-party asset that ships in the product, what it obliges us to do, and where the
credit appears. The parent credits page is generated from this file — if an asset is not
here, it is not in the build.

**Verification rule.** Each row carries a `verified` date. Licence text changes; a row older
than six months at release time is re-checked against the live source before shipping, not
trusted. Nothing in this file is legal advice, and the whole register wants one pass by
someone qualified before a paid launch.

| Asset | Source | Licence | Obligation | Credited | Verified |
|---|---|---|---|---|---|
| Noto Sans JP | fonts.google.com / notofonts releases | SIL OFL 1.1 | Attribution; reserved-name rule if modified | Parent credits page | 2026-08-23 (from supplied register — re-check before release) |
| KanjiVG | kanjivg.tagaini.net | CC BY-SA 3.0 | Attribution; ShareAlike on derived data | Parent credits page | 2026-08-23 (same) |
| TTS audio | VOICEVOX + VOICEVOX Nemo voice library, generated locally, self-hosted | Free for commercial use **with credit** | Credit token `VOICEVOX:Nemo` verbatim; must not present as human-recorded; no training/fine-tuning proprietary models on the output without separate licence | Parent credits / legal page | 2026-08-26 |

---

## Fonts — D11

**Decided: Noto Sans JP (SIL OFL 1.1) for all UI text.** OFL is the licence with the fewest
open questions for a web product that subsets and self-hosts, and that is the deciding
factor. IPAex is a reasonable font and a less obvious licence; when two options both work,
take the one that generates no further questions.

**But the font question splits in two, and your table treats it as one.** There are two
distinct rendering jobs here:

1. **UI chrome** — buttons, parent copy, labels. Settled: Noto Sans JP.
2. **The hero character** in 出会う — the large glyph a child studies to learn what the
   character *looks like*. Sans-serif forms diverge from handwritten forms in exactly the
   places that matter to a six-year-old: はね and とめ terminals, the crossing of 木, the
   shape of 令. A gothic face teaches a shape the child will then be marked wrong for
   writing at school. This is the pedagogically correct place to want 教科書体.

So `--font-ui` and `--font-hero` are **two CSS custom properties**, not one. Ship both
pointing at Noto Sans JP now; swapping the hero face later is a one-line change. See Q14 —
that is a budget decision, not a build blocker.

**What this does not affect:** the shape lamp. Stroke-order and component-assembly tasks
render product-drawn vectors, not font glyphs, so the stroke system is entirely independent
of whatever face we license. That materially lowers the stakes of the hero-face question,
which is worth knowing before spending money on it.

---

## Audio — D16 (revised 2026-08-26)

**Engine: VOICEVOX. Voice library: VOICEVOX Nemo. Files generated locally and hosted by
Kanji Densha. Runtime generation on the child path is prohibited** — invariant I10 unchanged:
what is written is what is heard, a missing file hides the speaker, never a fallback.

The prior xAI TTS decision is withdrawn. Do not use it, and do not request or store an
`XAI_API_KEY`.

**Why Nemo rather than the named VOICEVOX characters.** Nemo's voices carry no character
persona and its terms are unified across the library rather than differing per character.
That removes both the per-voice terms review and, more importantly, the prospect of a
children's educational product borrowing a third-party character's voice identity. For a
product whose voice *is* part of its teaching, unencumbered is worth more than expressive.

### Terms as recorded

- Source: https://voicevox.hiroshiba.jp/term/ and https://voicevox.hiroshiba.jp/nemo/term/
- Checked: **2026-08-26**
- Commercial and non-commercial use permitted **on condition of credit**.
- **Required credit token: `VOICEVOX:Nemo`** — the canonical form used in the terms. The
  parent-facing line may present it as 「音声：VOICEVOX:Nemo」 with the English technical
  credit `Voice: VOICEVOX:Nemo`, but the token itself is reproduced verbatim, not paraphrased.
  Placement: parent-facing credits / legal page.
- Prohibited: use without credit; use contrary to public order and morals; use that
  significantly damages the reputation or image of VOICEVOX or the voice providers.
- Each voice library follows its own terms. Nemo's are unified — but if a non-Nemo voice is
  ever used, its individual terms govern and this row does not transfer.
- Never claim the voice is human-recorded.
- Generated output must not be used to train or fine-tune proprietary ML models without a
  separate licence.
- Terms may change; the register's verification rule applies. Archive a dated copy of both
  terms pages alongside each batch manifest.

### Batch manifest — required fields

Every generated file records: `batch_id`, `engine`, `engine_version`, `voice_library`,
`speaker_name`, `speaker_id`, `generated_at`, `source_text`, `target_kanji`,
`taught_reading_id`, `word_surface_id` (or null), `generation_params`, `audio_query`,
`file_path`, `sha256`, `terms_urls`, `terms_checked_date`, `attribution`.

**`audio_query` is the field that matters most and is easy to omit.** VOICEVOX exposes a
full per-mora pitch and accent-phrase structure before synthesis. When a native reviewer
corrects an accent, that correction lives in the AudioQuery and nowhere else — the parameters
alone will not reproduce it. Store the complete AudioQuery JSON per file. It makes
regeneration exact, preserves human judgment, and turns a future engine upgrade from a
re-review of eighty files into a diff.

Engine output is not guaranteed byte-identical across versions. The recorded `sha256` is the
authority; files are never silently regenerated.

### The quality gate still stands

Word-surface audio is generated from the **word**, not the bare reading (isolated-kana pitch
accent is frequently wrong, and a child hearing an error confidently is the failure this
product exists to avoid). Citation readings are judged only for clarity and neutrality; word
surfaces are judged for **accent correctness against a reference**. Native-speaker review
precedes any batch beyond the pilot.

---

## Stroke data — D17

**Decided: KanjiVG as logic reference, product redraw for anything shipped, attribution on the
parent page.** Keep KanjiVG-derived material in `content/shape/` with its own LICENSE file so
the ShareAlike surface is contained and visible, and do not ship KanjiVG path data verbatim
in the app bundle. Stroke *order* and *count* are facts about the writing system and are not
themselves copyrightable; the drawn paths are the encumbered part.

---

## Explicitly excluded

Scraped dictionary recordings, textbook CD rips, YouTube audio, and research-only corpora.
None of these enter the repo in any form, including as temporary placeholders during
development — a placeholder is exactly how one ends up in a release build.
