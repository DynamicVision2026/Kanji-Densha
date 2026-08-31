import { describe, it, expect } from 'vitest';
import { evaluateProgress, initialProgress, nextEchoEligibleAtHours, EchoRejectedError, LAMPS } from './index';
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

// docs/reviews/remediation-plan.md R2: exported for read-side callers (e.g.
// the adapter's echoDueAt) that never go through assertEchoEligible, so this
// function's own guard clause needs its own coverage — assertEchoEligible
// never calls it with a non-almost/null-almostAt state (it already checked
// both beforehand), so that branch was otherwise dead from this package's
// own test suite's point of view.
describe('nextEchoEligibleAtHours (R2 single source)', () => {
  it('is null when the character is not almost', () => {
    expect(nextEchoEligibleAtHours({ status: 'new', almostAt: null, echoes: [] }, PARAMS)).toBeNull();
    expect(nextEchoEligibleAtHours({ status: 'perfect', almostAt: 100, echoes: [] }, PARAMS)).toBeNull();
  });

  it('is null when almost but almostAt is unset (the unreachable state assertEchoEligible names)', () => {
    expect(nextEchoEligibleAtHours({ status: 'almost', almostAt: null, echoes: [] }, PARAMS)).toBeNull();
  });

  it('first echo: almostAt + echoFirstDelayHours', () => {
    expect(nextEchoEligibleAtHours({ status: 'almost', almostAt: 100, echoes: [] }, PARAMS)).toBe(120);
  });

  it('second echo: max(almostAt + echoSecondDelayHours, firstOk.at + 48h floor)', () => {
    expect(
      nextEchoEligibleAtHours(
        { status: 'almost', almostAt: 100, echoes: [{ at: 130, ok: true, sessionId: 'e1' }] },
        PARAMS,
      ),
    ).toBe(268); // 100 + 168 (echoSecondDelayHours) beats 130 + 48 (floor) here
  });
});
