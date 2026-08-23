// Property tests (architecture §1.5). Deterministic: a fixed-seed Park–Miller
// PRNG drives the fuzzing so runs are reproducible and the engine itself never
// sees a clock or a runtime RNG. Invariants asserted:
//   - status never becomes `perfect` with fewer than two successful echoes
//   - no single-sessionId stream ever reaches `perfect` (I7)
//   - soft answers never increase consecutiveWrong
//   - identical inputs produce identical outputs, and never mutate the input
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
const SESSIONS = ['s1', 's2', 's3', 's4', 's5'];
const ALL_LAMPS: Lamp[] = ['reading', 'meaning', 'shape'];

// Park–Miller minstd PRNG — deterministic, no runtime RNG, no clock.
function makeRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  const v = arr[rng() % arr.length];
  return v as T;
}

function okEchoes(p: CharacterProgress): number {
  return p.echoes.filter((e) => e.ok).length;
}

function randomEvent(rng: () => number, at: number, forceSession?: string): ProgressEvent {
  const sessionId = forceSession ?? pick(rng, SESSIONS);
  const kind = rng() % 5;
  if (kind === 0) return { type: 'encounter', at, sessionId };
  if (kind === 1) return { type: 'understand', at, sessionId };
  const lamp = pick(rng, ALL_LAMPS);
  return {
    type: 'answer',
    at,
    sessionId,
    itemId: 'i',
    lamp,
    correct: rng() % 3 !== 0,
    mode: rng() % 2 === 0 ? 'practice' : 'echo',
    surfaceId: rng() % 2 === 0 ? `u${rng() % 6}` : null,
    soft: rng() % 4 === 0,
  };
}

describe('property: determinism, no mutation, echo/soft invariants', () => {
  it('holds across fuzzed multi-session streams', () => {
    const rng = makeRng(42);
    for (let trial = 0; trial < 400; trial += 1) {
      let state = initialProgress('山');
      let at = 0;
      for (let step = 0; step < 14; step += 1) {
        at += rng() % 50;
        if (rng() % 5 === 0) at += 150; // occasional jump past an echo delay
        const ev = randomEvent(rng, at);
        const beforeJSON = JSON.stringify(state);

        let next1: CharacterProgress;
        try {
          next1 = evaluateProgress(state, ev, PARAMS, RL);
        } catch (e) {
          expect(e).toBeInstanceOf(EchoRejectedError);
          expect(JSON.stringify(state)).toBe(beforeJSON); // a throw mutates nothing
          continue;
        }

        // Determinism: identical inputs → identical outputs.
        const next2 = evaluateProgress(state, ev, PARAMS, RL);
        expect(next2).toEqual(next1);
        // The input state is never mutated.
        expect(JSON.stringify(state)).toBe(beforeJSON);
        // perfect ⇒ at least two successful echoes.
        if (next1.status === 'perfect') expect(okEchoes(next1)).toBeGreaterThanOrEqual(2);
        // soft answers never increase consecutiveWrong.
        if (ev.type === 'answer' && ev.soft) {
          expect(next1.consecutiveWrong[ev.lamp]).toBeLessThanOrEqual(state.consecutiveWrong[ev.lamp]);
        }
        state = next1;
      }
    }
  });

  it('no single-sessionId stream ever reaches perfect (I7 / MR-5.4)', () => {
    const rng = makeRng(1337);
    for (let trial = 0; trial < 300; trial += 1) {
      let state = initialProgress('山');
      let at = 0;
      for (let step = 0; step < 16; step += 1) {
        at += rng() % 300; // large jumps so echo delays are satisfied on time
        const ev = randomEvent(rng, at, 's1'); // everything in one session
        try {
          state = evaluateProgress(state, ev, PARAMS, RL);
        } catch (e) {
          expect(e).toBeInstanceOf(EchoRejectedError);
          continue;
        }
        expect(state.status).not.toBe('perfect');
      }
    }
  });
});

// Targeted, non-fuzz confirmations of the core echo arithmetic.
function reachAlmost(): CharacterProgress {
  let s = initialProgress('山');
  s = evaluateProgress(s, { type: 'encounter', at: 0, sessionId: 's1' }, PARAMS, RL);
  s = evaluateProgress(s, { type: 'understand', at: 0, sessionId: 's1' }, PARAMS, RL);
  s = evaluateProgress(
    s,
    { type: 'answer', at: 0, sessionId: 's1', itemId: 'i', lamp: 'reading', correct: true, mode: 'practice', surfaceId: 'r1', soft: false },
    PARAMS,
    RL,
  );
  s = evaluateProgress(
    s,
    { type: 'answer', at: 0, sessionId: 's1', itemId: 'i', lamp: 'meaning', correct: true, mode: 'practice', surfaceId: 'm1', soft: false },
    PARAMS,
    RL,
  );
  return s;
}

describe('property: perfect requires exactly two spaced echoes (I7)', () => {
  it('one successful echo leaves the character at almost', () => {
    let s = reachAlmost();
    expect(s.status).toBe('almost');
    s = evaluateProgress(s, { type: 'answer', at: 20, sessionId: 's2', itemId: 'i', lamp: 'reading', correct: true, mode: 'echo', surfaceId: 'r2', soft: false }, PARAMS, RL);
    s = evaluateProgress(s, { type: 'answer', at: 20, sessionId: 's2', itemId: 'i', lamp: 'meaning', correct: true, mode: 'echo', surfaceId: 'm2', soft: false }, PARAMS, RL);
    expect(okEchoes(s)).toBe(1);
    expect(s.status).toBe('almost');
  });

  it('two spaced successful echoes reach perfect with exactly one stamp', () => {
    let s = reachAlmost();
    s = evaluateProgress(s, { type: 'answer', at: 20, sessionId: 's2', itemId: 'i', lamp: 'reading', correct: true, mode: 'echo', surfaceId: 'r2', soft: false }, PARAMS, RL);
    s = evaluateProgress(s, { type: 'answer', at: 20, sessionId: 's2', itemId: 'i', lamp: 'meaning', correct: true, mode: 'echo', surfaceId: 'm2', soft: false }, PARAMS, RL);
    s = evaluateProgress(s, { type: 'answer', at: 168, sessionId: 's3', itemId: 'i', lamp: 'reading', correct: true, mode: 'echo', surfaceId: 'r3', soft: false }, PARAMS, RL);
    s = evaluateProgress(s, { type: 'answer', at: 168, sessionId: 's3', itemId: 'i', lamp: 'meaning', correct: true, mode: 'echo', surfaceId: 'm3', soft: false }, PARAMS, RL);
    expect(s.status).toBe('perfect');
    expect(okEchoes(s)).toBe(2);
    expect(s.stampedAt).toBe(168);
  });
});
