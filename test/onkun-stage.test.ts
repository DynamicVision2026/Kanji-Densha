// Reference-ingest validation (M2 Part 0 / D13).
//
// Asserts the structural totals the architect recorded, so a corrupted or
// swapped re-ingest is caught rather than silently becoming the gate's authority.
// Also re-verifies the source xlsx hash against docs/reference/README.md and the
// hash embedded in the generated JSON.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = JSON.parse(
  readFileSync(join(repoRoot, 'content/reference/onkun-stage.json'), 'utf8'),
) as {
  source: { sha256: string };
  totals: {
    main_table_rows: number;
    unique_kanji: number;
    elementary_kanji: number;
    per_grade: Record<string, number>;
    stages: Record<string, number>;
    appendix_1_rows: number;
    appendix_2_rows: number;
  };
  main_table: {
    kanji: string;
    reading_kana: string;
    reading_type: string;
    school_stage: string;
    kanji_elementary_grade: number | null;
    confidence: string;
  }[];
  appendix_1: { reading_type: string }[];
  appendix_2: { reading_type: string }[];
};

describe('onkun-stage.json — reference ingest (Part 0)', () => {
  it('carries the officially-known structural totals', () => {
    expect(doc.totals.main_table_rows).toBe(4388);
    expect(doc.totals.unique_kanji).toBe(2136); // 常用漢字表
    expect(doc.totals.elementary_kanji).toBe(1026); // 教育漢字
    expect(doc.totals.per_grade).toEqual({ '1': 80, '2': 160, '3': 200, '4': 202, '5': 193, '6': 191 });
    expect(doc.totals.stages).toEqual({ elementary: 2062, junior_high: 2008, high_school: 318 });
  });

  it('recomputes the totals from the rows (the embedded totals are not trusted blindly)', () => {
    const gradeOf = new Map<string, number>();
    for (const r of doc.main_table) {
      if (r.kanji_elementary_grade !== null) gradeOf.set(r.kanji, r.kanji_elementary_grade);
    }
    const perGrade: Record<string, number> = {};
    for (const g of gradeOf.values()) perGrade[String(g)] = (perGrade[String(g)] ?? 0) + 1;
    expect(new Set(doc.main_table.map((r) => r.kanji)).size).toBe(2136);
    expect(gradeOf.size).toBe(1026);
    expect(perGrade).toEqual({ '1': 80, '2': 160, '3': 200, '4': 202, '5': 193, '6': 191 });
  });

  it('has high confidence on all but two rows', () => {
    const high = doc.main_table.filter((r) => r.confidence === 'high').length;
    expect(high).toBe(4386);
  });

  it('accepts special and proper_name reading types in the appendices', () => {
    expect(doc.appendix_1).toHaveLength(123);
    expect(doc.appendix_2).toHaveLength(12);
    expect(new Set(doc.appendix_1.map((r) => r.reading_type))).toEqual(new Set(['special']));
    expect(new Set(doc.appendix_2.map((r) => r.reading_type))).toEqual(new Set(['proper_name']));
  });

  it('re-verifies the source xlsx hash against README and the embedded hash', () => {
    const bytes = readFileSync(join(repoRoot, 'docs/reference/mext_onkun_school_stage_assignments_2017.xlsx'));
    const actual = createHash('sha256').update(bytes).digest('hex');
    const readme = readFileSync(join(repoRoot, 'docs/reference/README.md'), 'utf8');
    const m = readme.match(/mext_onkun_school_stage_assignments_2017\.xlsx[^\n|]*\|\s*`([0-9a-f]{64})`/);
    expect(m).not.toBeNull();
    expect(actual).toBe(m?.[1]);
    expect(doc.source.sha256).toBe(actual);
  });

  // The character-level facts the twenty M2 records must be authored against.
  const elementaryReadings = (k: string) =>
    doc.main_table.filter((r) => r.kanji === k && r.school_stage === 'elementary').map((r) => r.reading_kana);
  const laterReadings = (k: string) =>
    doc.main_table.filter((r) => r.kanji === k && r.school_stage !== 'elementary').map((r) => r.reading_kana);

  it('reflects the character facts the twenty records are checked against', () => {
    expect(elementaryReadings('生')).toHaveLength(10); // no lamp can test ten (D14)
    expect(elementaryReadings('川')).toEqual(['かわ']); // only one → echo varies the surface (D15)
    expect(laterReadings('川')).toContain('セン');
    expect(laterReadings('火')).toContain('ほ'); // high_school
    expect(laterReadings('目')).toEqual(expect.arrayContaining(['ボク', 'ま']));
    expect(elementaryReadings('大')).toContain('おおいに');
  });
});
