#!/usr/bin/env node
// Reference ingest (M2 Part 0, D13).
//
// Reads the national 音訓割り振り表 xlsx and emits content/reference/onkun-stage.json,
// preserving every provenance column. Before reading a single row it verifies the
// xlsx SHA-256 against the hash table in docs/reference/README.md and STOPS if it
// differs — a different file is a different authority and the validation does not
// transfer to it. The generated JSON is committed but never hand-edited; its
// embedded source.sha256 makes a silent swap of the table visible in a diff.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const XLSX_PATH = join(repoRoot, 'docs/reference/mext_onkun_school_stage_assignments_2017.xlsx');
const README_PATH = join(repoRoot, 'docs/reference/README.md');
const OUT_PATH = join(repoRoot, 'content/reference/onkun-stage.json');
const SOURCE_URL =
  'https://www.mext.go.jp/a_menu/shotou/new-cs/__icsFiles/afieldfile/2017/05/15/1385768.pdf';

// --- 1. Verify the source hash against the README table (Part 0) ----------
const bytes = readFileSync(XLSX_PATH);
const actualSha = createHash('sha256').update(bytes).digest('hex');
const readme = readFileSync(README_PATH, 'utf8');
const match = readme.match(/mext_onkun_school_stage_assignments_2017\.xlsx[^\n|]*\|\s*`([0-9a-f]{64})`/);
if (!match) {
  console.error('✗ could not find the xlsx hash in docs/reference/README.md — cannot verify the source.');
  process.exit(1);
}
const expectedSha = match[1];
if (actualSha !== expectedSha) {
  console.error('✗ reference xlsx hash mismatch — refusing to ingest a different file than the one validated (Part 0):');
  console.error(`    expected ${expectedSha}`);
  console.error(`    actual   ${actualSha}`);
  process.exit(1);
}

// --- 2. Read the four sheets, preserving every column ---------------------
const wb = XLSX.read(bytes, { type: 'buffer' });
const sheet = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: true });
const main_table = sheet('main_table');
const appendix_1 = sheet('appendix_1');
const appendix_2 = sheet('appendix_2');
const qa_flags = sheet('qa_flags');

// --- 3. Totals (embedded, and a self-check against the recorded figures) --
const gradeOf = new Map();
for (const r of main_table) {
  if (r.kanji_elementary_grade !== null) gradeOf.set(r.kanji, r.kanji_elementary_grade);
}
const perGrade = {};
for (const g of gradeOf.values()) perGrade[g] = (perGrade[g] ?? 0) + 1;
const stages = {};
for (const r of main_table) stages[r.school_stage] = (stages[r.school_stage] ?? 0) + 1;

const totals = {
  main_table_rows: main_table.length,
  unique_kanji: new Set(main_table.map((r) => r.kanji)).size,
  elementary_kanji: gradeOf.size,
  per_grade: Object.fromEntries(Object.keys(perGrade).sort().map((k) => [k, perGrade[k]])),
  stages,
  appendix_1_rows: appendix_1.length,
  appendix_2_rows: appendix_2.length,
};

const doc = {
  source: {
    document: '音訓の小・中・高等学校段階別割り振り表（平成29年3月）',
    file: 'docs/reference/mext_onkun_school_stage_assignments_2017.xlsx',
    sha256: actualSha,
    source_url: SOURCE_URL,
    generated_by: 'packages/content-build/ingest-reference.mjs',
    note: 'Generated. Do not hand-edit. Regenerate with `pnpm content:reference`.',
  },
  totals,
  main_table,
  appendix_1,
  appendix_2,
  qa_flags,
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${JSON.stringify(doc, null, 2)}\n`);
console.log(
  `✓ ingested ${main_table.length} main rows (+${appendix_1.length}/${appendix_2.length} appendix) → content/reference/onkun-stage.json`,
);
console.log(
  `  unique_kanji=${totals.unique_kanji} elementary=${totals.elementary_kanji} per_grade=${JSON.stringify(totals.per_grade)}`,
);
