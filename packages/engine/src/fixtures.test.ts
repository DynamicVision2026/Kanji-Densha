// Fixture runner. Each packages/engine/fixtures/*.json encodes one clause of
// mastery-rules.md and is named after it (architecture §1.5). A fixture folds
// its events from a fresh `initialProgress` and asserts either a resulting
// state (partial match on the fields the clause governs) or that the final
// event is rejected (MR-5 eligibility → EchoRejectedError).
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { evaluateProgress, initialProgress, EchoRejectedError } from './evaluate';
import type { CharacterProgress, GradeParams, Lamp, ProgressEvent } from './types';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

const DEFAULT_PARAMS: GradeParams = {
  grade: 1,
  sessionItemCap: 6,
  itemsPerLamp: 2,
  echoFirstDelayHours: 20,
  echoSecondDelayHours: 168,
  echoPerDayCap: 3,
  lostConsecutiveWrong: 3,
  lostLifetimeWrong: 6,
  forceReteachOnWrong: false,
};

interface Fixture {
  clause: string;
  name: string;
  requiredLamps?: Lamp[];
  params?: GradeParams;
  characterId?: string;
  events: ProgressEvent[];
  expect?: Record<string, unknown>;
  expectError?: { clause: string };
}

// Keep only the keys present in `shape`, recursively (arrays compared whole).
function project(actual: unknown, shape: unknown): unknown {
  if (shape !== null && typeof shape === 'object' && !Array.isArray(shape)) {
    const src = (actual ?? {}) as Record<string, unknown>;
    const shp = shape as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(shp)) out[k] = project(src[k], shp[k]);
    return out;
  }
  return actual;
}

const files = readdirSync(fixturesDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

describe('mastery-rules fixtures', () => {
  it('every fixture file is discovered', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const fx = JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')) as Fixture;
    const params = fx.params ?? DEFAULT_PARAMS;
    const rl: readonly Lamp[] = fx.requiredLamps ?? ['reading', 'meaning'];
    const cid = fx.characterId ?? '山';

    it(`${fx.clause} — ${fx.name} [${file}]`, () => {
      let state: CharacterProgress = initialProgress(cid);
      const events = fx.events;

      if (fx.expectError) {
        for (let i = 0; i < events.length - 1; i += 1) {
          const ev = events[i];
          if (ev !== undefined) state = evaluateProgress(state, ev, params, rl);
        }
        const last = events[events.length - 1];
        let err: unknown;
        try {
          if (last !== undefined) evaluateProgress(state, last, params, rl);
        } catch (e) {
          err = e;
        }
        expect(err).toBeInstanceOf(EchoRejectedError);
        expect((err as EchoRejectedError).clause).toBe(fx.expectError.clause);
        return;
      }

      for (const ev of events) state = evaluateProgress(state, ev, params, rl);
      expect(project(state, fx.expect)).toEqual(fx.expect);
    });
  }
});
