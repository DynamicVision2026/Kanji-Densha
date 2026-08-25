// grades.yaml completeness (spec §11 / build-plan M1).
//
// The named failure mode is G3–G6 silently reusing G1 numbers. This test parses
// the authored YAML and asserts every field is present, correctly typed, for all
// six grades — and that the values are genuinely per-band, not a blanket copy.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import type { GradeParams } from '@kanji-densha/engine';

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = join(here, '..', 'content', 'params', 'grades.yaml');
const doc = parse(readFileSync(yamlPath, 'utf8')) as { grades: GradeParams[] };

const NUMERIC_FIELDS: (keyof GradeParams)[] = [
  'sessionItemCap',
  'itemsPerLamp',
  'echoFirstDelayHours',
  'echoSecondDelayHours',
  'echoPerDayCap',
  'lostConsecutiveWrong',
  'lostLifetimeWrong',
];

describe('content/params/grades.yaml', () => {
  it('specifies exactly the six grades 1..6', () => {
    expect(doc.grades.map((g) => g.grade)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  for (const grade of [1, 2, 3, 4, 5, 6] as const) {
    it(`grade ${grade} specifies every field explicitly and correctly typed`, () => {
      const g = doc.grades.find((x) => x.grade === grade);
      expect(g).toBeDefined();
      if (g === undefined) return;
      for (const f of NUMERIC_FIELDS) {
        expect(typeof g[f], `${f} must be a number`).toBe('number');
        expect(Number.isFinite(g[f]) && (g[f] as number) > 0, `${f} must be > 0`).toBe(true);
      }
      expect(typeof g.forceReteachOnWrong, 'forceReteachOnWrong must be a boolean').toBe('boolean');
    });
  }

  it('is per-band, not a blanket copy of G1 (guards the spec §11 failure mode)', () => {
    const byGrade = (n: number): GradeParams => {
      const g = doc.grades.find((x) => x.grade === n);
      if (g === undefined) throw new Error(`missing grade ${n}`);
      return g;
    };
    // Anchored band difference: first echo delay is 20h for G1–G3, 36h for G4–G6.
    expect(byGrade(1).echoFirstDelayHours).toBe(20);
    expect(byGrade(4).echoFirstDelayHours).toBe(36);
    expect(byGrade(6).echoFirstDelayHours).toBe(36);
    // The upper grades are not identical to G1 across the board.
    expect(byGrade(6)).not.toEqual({ ...byGrade(1), grade: 6 });
  });

  it('echoSecondDelayHours is ~168 (one week) for every grade (spec §5.4)', () => {
    for (const g of doc.grades) expect(g.echoSecondDelayHours).toBe(168);
  });
});
