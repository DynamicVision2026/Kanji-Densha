import { describe, it, expect } from 'vitest';
import { evaluateProgress, initialProgress, EchoRejectedError, LAMPS } from './index';
import type { GradeParams } from './index';

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

describe('engine public surface', () => {
  it('initialProgress is a fresh new character', () => {
    const p = initialProgress('山');
    expect(p.status).toBe('new');
    expect(p.stampedAt).toBeNull();
    expect(p.almostAt).toBeNull();
    expect(LAMPS).toEqual(['reading', 'meaning', 'shape']);
  });

  it('encounter sets only encountered, and does not mutate the input (MR-3.1)', () => {
    const p = initialProgress('山');
    const n = evaluateProgress(p, { type: 'encounter', at: 0, sessionId: 's1' }, PARAMS, [
      'reading',
      'meaning',
    ]);
    expect(n.encountered).toBe(true);
    expect(n.understood).toBe(false);
    expect(p.encountered).toBe(false); // previous state untouched
  });

  it('exports EchoRejectedError', () => {
    expect(typeof EchoRejectedError).toBe('function');
  });
});
