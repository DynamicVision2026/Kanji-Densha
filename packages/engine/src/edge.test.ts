// Defensive-path coverage. The store never hand-builds a CharacterProgress
// (architecture §3: `apply` is the only writer), but the engine still guards
// against a malformed one rather than computing on a null clock value.
import { describe, it, expect } from 'vitest';
import { evaluateProgress, initialProgress, EchoRejectedError } from './evaluate';
import type { CharacterProgress, GradeParams, Lamp, ProgressEvent } from './types';

const PARAMS: GradeParams = {
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
const RL: readonly Lamp[] = ['reading', 'meaning'];

const echo: ProgressEvent = {
  type: 'answer',
  at: 1000,
  sessionId: 's2',
  itemId: 'i',
  lamp: 'reading',
  correct: true,
  mode: 'echo',
  surfaceId: 'r2',
  soft: false,
};

describe('engine defensive guards', () => {
  it('rejects an echo on a malformed almost state with a null almostAt', () => {
    const malformed: CharacterProgress = {
      ...initialProgress('山'),
      status: 'almost',
      encountered: true,
      understood: true,
      lamps: { reading: true, meaning: true, shape: false },
      almostAt: null, // malformed: almost without almostAt
      almostSessionId: 's1',
    };
    let err: unknown;
    try {
      evaluateProgress(malformed, echo, PARAMS, RL);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EchoRejectedError);
    expect((err as EchoRejectedError).clause).toBe('MR-5.1');
  });
});
