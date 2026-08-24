// Loads the generated, published bundles (I2: content-dist/ only, never
// content/). Bundled at build time via Vite's JSON import support — this is
// static published data, not something fetched at runtime.
import type { GradeParams, Grade } from '@kanji-densha/engine';
import type { ContentLookup } from '@kanji-densha/store';
import type { CharacterBundle, Manifest } from './types.js';
import g1 from '../../../../content-dist/g1.json' with { type: 'json' };
import gradesData from '../../../../content-dist/grades.json' with { type: 'json' };
import manifest from '../../../../content-dist/manifest.json' with { type: 'json' };

const ALL_CHARACTERS = g1 as unknown as CharacterBundle[];
const MANIFEST = manifest as unknown as Manifest;

interface GradeParamsRow {
  grade: number;
  sessionItemCap: number;
  itemsPerLamp: number;
  echoFirstDelayHours: number;
  echoSecondDelayHours: number;
  echoPerDayCap: number;
  lostConsecutiveWrong: number;
  lostLifetimeWrong: number;
  forceReteachOnWrong: boolean;
}

function toGradeParams(row: GradeParamsRow): GradeParams {
  if (row.grade < 1 || row.grade > 6 || !Number.isInteger(row.grade)) {
    throw new Error(`content-dist/grades.json: grade ${row.grade} is not 1..6`);
  }
  const grade = row.grade as Grade;
  return { ...row, grade };
}

const GRADE_PARAMS: readonly GradeParams[] = (gradesData as GradeParamsRow[]).map(toGradeParams);

const byId = new Map<string, CharacterBundle>(ALL_CHARACTERS.map((c) => [c.character, c]));

export function getCharacter(characterId: string): CharacterBundle | undefined {
  return byId.get(characterId);
}

function requireCharacter(characterId: string): CharacterBundle {
  const c = byId.get(characterId);
  if (c === undefined) {
    throw new Error(`content-dist has no published record for character "${characterId}"`);
  }
  return c;
}

export function getRequiredLamps(characterId: string): readonly ('reading' | 'meaning' | 'shape')[] {
  const c = requireCharacter(characterId);
  return c.shape.published ? ['reading', 'meaning', 'shape'] : ['reading', 'meaning'];
}

export function getGradeParams(characterId: string): GradeParams {
  const c = requireCharacter(characterId);
  const params = GRADE_PARAMS.find((p) => p.grade === c.grade);
  if (params === undefined) {
    throw new Error(`content-dist/grades.json has no row for grade ${c.grade}`);
  }
  return params;
}

/** I10: a speaker renders only if its file is in the audio manifest. */
export function audioFileExists(filename: string): boolean {
  return MANIFEST.audio_manifest.includes(filename);
}

export const contentLookup: ContentLookup = { getGradeParams, getRequiredLamps };
