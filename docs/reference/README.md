# Reference data — the national tables

Status: **validated 2026-08-23.** These four documents are the authority for what the
product may teach. They are not content; they are the rules content is checked against.

## Recorded hashes

Verify on receipt. These are the exact artifacts the validation below was run against; a
different hash means a different file, and the validation does not transfer to it.

Commit the four files with these canonical names. The 常用漢字表 arrives inside a zip —
commit the **extracted PDF**, not the archive, and discard the `__MACOSX` folder.

| File | SHA-256 |
|---|---|
| `mext_onkun_school_stage_assignments_2017.xlsx` | `ab479edec8ae7d4c1204f88265949b57720f89917751ac869280161057b5d217` |
| `常用漢字表（平成22年11月30日）.pdf` (extracted) | `d9f28aeb4ce8250dbde07de20ac66cca71805ba09d94e4942c752dffa84d8d42` |
| `送り仮名の付け方.pdf` | `3b6b47b18122c707115261cbb7172abbb8b3b4b5f2fb746270acee3639914cde` |
| `音訓の小・中・高等学校段階別割り振り表（平成29年3月）.pdf` | `0bc189982a50122f1e35dd6a751bfdff0ec5a0ad67e99eda916d012f859a5ae4` |

## What "validated" means here — precisely

The xlsx is a **conversion** of the MEXT PDF, and the honest description of its assurance is:

- **Done:** structural validation against externally known-official totals — 2,136 unique
  kanji, 1,026 carrying an elementary grade, per-grade counts of 80/160/200/202/193/191, and
  a spot check of twenty Grade-1 characters' reading/stage splits. Every row carries a source
  page and a `confidence` value; 4,386 of 4,388 are `high`.
- **Not done:** a line-by-line re-derivation of all 4,388 rows from the PDF.

That distinction matters because this file is the gate's authority. Treat it as
high-confidence and provenance-tracked, not as infallible. The validation test specified in
M2 Part 0 is the right level of assurance for a build gate; a disputed row is settled by
opening the PDF at the page number the row already records.

**The artifact is self-attesting.** Every row's `source_url` is the same single MEXT link —
`https://www.mext.go.jp/a_menu/shotou/new-cs/__icsFiles/afieldfile/2017/05/15/1385768.pdf` —
which is exactly the direct URL located independently from the spec's §8.4 reference. Rows
cite printed pages 2 through 50 of that document. The source PDF is in this directory beside
it, so nothing needs to be re-downloaded to check a row.

The important consequence: invariant I4 stops being a promise the author keeps and becomes a
check the gate runs. Before this, "only elementary readings light the reading lamp" meant an
author put a reading in the right YAML field. Now the gate resolves every reading against
MEXT's own table and fails the build if it does not match.

---

## 1. `mext_onkun_school_stage_assignments_2017.xlsx` — the load-bearing asset

A structured digitisation of 音訓の小・中・高等学校段階別割り振り表 (平成29年3月), with
per-row provenance. This is the most valuable file in the project so far.

**Shape.** Four sheets. `main_table` is 4,388 rows, one per (kanji, reading), with columns:
`kanji`, `reading_kana`, `reading_type` (on/kun), `school_stage`
(elementary/junior_high/high_school), `kanji_elementary_grade`, `source_pdf_page`,
`source_printed_page`, `notes`, `confidence`, `source_url`. `appendix_1` holds 123 熟字訓
(whole-word special readings, `reading_type: special`). `appendix_2` holds 12 prefecture
names (`proper_name`). `qa_flags` holds three known issues.

**Validation run against it.** 2,136 unique kanji, matching the 常用漢字表 count. 1,026 kanji
carry an elementary grade, and the per-grade distribution is
**80 / 160 / 200 / 202 / 193 / 191** — exactly the 学年別漢字配当表. Reading stages split
2,062 elementary, 2,008 junior high, 318 high school. Confidence is `high` on 4,386 of 4,388
rows. This table is trustworthy enough to be the gate's authority.

**Known issues to carry forward.** `qa_flags` warns that 叱 has no Unicode text mapping in the
source PDF and its two rows were recovered visually — 叱 is not 教育漢字, so it does not touch
the child path, but the flag stays in the repo. The two appendix sheets use `special` and
`proper_name` where on/kun does not apply; the schema must accept those values.

**Ingestion.** Convert to `content/reference/onkun-stage.json` at build time, keeping every
provenance column. Never hand-edit the JSON. Record the source file hash so a silent change
to the table is visible in a diff.

## 2. `常用漢字表（平成22年11月30日）.pdf`

The 2,136-character 常用漢字表. Authority for glyph forms (字体) and the 付表. Reference for
humans; not machine-ingested in M2.

## 3. `送り仮名の付け方`

Authority for okurigana. This matters more than it first appears: kun readings in the table
carry their okurigana inline (生 has いきる, いかす, いける, うまれる, うむ, はえる, はやす),
so every word surface written with a kun reading has a correct and an incorrect spelling, and
the 通則 in this document decide which. Content authors consult it; the gate cannot enforce it.

## 4. `音訓の小・中・高等学校段階別割り振り表` (PDF)

The source PDF behind the xlsx. Keep it in the repo beside the spreadsheet so any disputed
row can be checked against the page number the xlsx already records.

---

## What the gate must now do

1. **Resolve, don't trust.** For every character, every entry in `elementary_readings` must
   match a row in the reference table with `school_stage: elementary` and a
   `kanji_elementary_grade` equal to the character's declared grade. A mismatch fails the
   build and names the row.
2. **Reject later readings.** Any reading item referencing a reading whose stage is
   `junior_high` or `high_school` fails the build, whichever field the author put it in.
3. **Derive rather than author.** `elementary_readings` and `later_readings` should be
   generated from the reference table for each character, not typed by hand. The author's job
   is choosing which readings to *teach*, not recalling which ones are permitted.

## What this immediately reveals about the twenty M2 characters

Checked against the table, and each of these is a content-design fact, not a bug:

- **生 has ten elementary readings** (セイ, ショウ, いきる, いかす, いける, うまれる, うむ,
  はえる, はやす, なま) plus おう and き at junior high. No child lamp can test ten readings.
- **川 has exactly one** elementary reading, かわ — セン is junior high. So 川's echo cannot
  vary the reading at all; it must vary the word surface within かわ.
- **目** carries ボク at junior high and ま at high school; **火** carries ほ at high school.
  These are precisely the traps I4 exists to catch, and they are now caught automatically.
- **大** includes おおいに at elementary, which is not what most adults would guess.
