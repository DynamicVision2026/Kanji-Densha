// Reference resolution (D13). The national table (content/reference/onkun-stage.json)
// is the authority: elementary and later readings are read FROM it per character,
// never trusted from the authored record. The gate resolves taught_readings
// against this, so I4 is a check the build runs, not a promise the author keeps.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export interface Reading {
  readonly kana: string;
  readonly type: string; // on | kun (| special | proper_name in the appendices)
  readonly stage: string; // elementary | junior_high | high_school
  readonly grade: number | null;
}
export interface CharReadings {
  readonly grade: number | null;
  readonly elementary: readonly Reading[];
  readonly later: readonly Reading[];
}

interface OnkunRow {
  kanji: string;
  reading_kana: string;
  reading_type: string;
  school_stage: string;
  kanji_elementary_grade: number | null;
}

export function repoRootFrom(metaUrl: string): string {
  // dist/reference.js → packages/content-build/dist → repo root is three up.
  return join(dirname(fileURLToPath(metaUrl)), '..', '..', '..');
}

/** Load the reference table and index it by kanji. */
export function loadReference(repoRoot: string): Map<string, CharReadings> {
  const path = join(repoRoot, 'content/reference/onkun-stage.json');
  const doc = JSON.parse(readFileSync(path, 'utf8')) as { main_table: OnkunRow[] };
  const byKanji = new Map<string, { elementary: Reading[]; later: Reading[]; grade: number | null }>();
  for (const row of doc.main_table) {
    let entry = byKanji.get(row.kanji);
    if (entry === undefined) {
      entry = { elementary: [], later: [], grade: null };
      byKanji.set(row.kanji, entry);
    }
    const reading: Reading = {
      kana: row.reading_kana.normalize('NFC'),
      type: row.reading_type,
      stage: row.school_stage,
      grade: row.kanji_elementary_grade,
    };
    if (row.school_stage === 'elementary') {
      entry.elementary.push(reading);
      if (row.kanji_elementary_grade !== null) entry.grade = row.kanji_elementary_grade;
    } else {
      entry.later.push(reading);
    }
  }
  const out = new Map<string, CharReadings>();
  for (const [k, v] of byKanji) out.set(k, { grade: v.grade, elementary: v.elementary, later: v.later });
  return out;
}

export const readingKey = (type: string, kana: string): string => `${type}:${kana.normalize('NFC')}`;
