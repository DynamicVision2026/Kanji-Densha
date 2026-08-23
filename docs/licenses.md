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
| TTS voices | pipeline vendor, TBD | per D16 | per vendor; credit line if required | Parent credits page | pending D16 |

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

## Audio — D16

**Decided: pre-rendered fixed files, vendor deferred, with a commercial-terms gate before any
file enters the repo.** Already invariant I10: what is written is what is heard; a missing
file hides the speaker; no live TTS, ever.

Vendor guidance, in order of preference:
- **Cloud TTS with explicit commercial redistribution rights** for pre-rendered assets. Read
  the specific clause about hosting and redistributing generated audio in a product, not just
  the general commercial-use line.
- **VOICEVOX** is viable but its per-voice-library terms vary and several require a named
  credit string. If used, the credit goes in the register above, per voice, not as a generic
  line.
- **Research corpora such as JSUT are excluded.** Research-only means research-only, and a
  children's product is the wrong place to test that boundary.

**One quality rule that is not a licensing rule.** Feed the TTS the *word*, not the bare
reading, wherever a word surface exists. Japanese pitch accent on an isolated kana string is
frequently wrong, and a child hearing やま with the wrong accent is being taught an error
confidently. Bare citation readings are acceptable for the わかる beat; word-surface audio
must be generated from the word. Sample a set per grade for native-speaker review before the
wave is marked done — this belongs in the content gate's human step, not the automated one.

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
