import { describe, it, expect } from 'vitest';
import { LocalStore } from './local-store';
import type { ContentLookup, StorageLike } from './types';
import type { GradeParams } from '@kanji-densha/engine';

const PARAMS: GradeParams = {
  grade: 1,
  sessionItemCap: 3,
  itemsPerLamp: 1,
  echoFirstDelayHours: 20,
  echoSecondDelayHours: 168,
  echoPerDayCap: 8,
  lostConsecutiveWrong: 3,
  lostLifetimeWrong: 12,
  forceReteachOnWrong: true,
};

const LOOKUP: ContentLookup = {
  getGradeParams: () => PARAMS,
  getRequiredLamps: () => ['reading', 'meaning'],
};

function fakeStorage(seed: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('LocalStore', () => {
  it('load on an empty store returns {}', async () => {
    const store = new LocalStore(LOOKUP, fakeStorage());
    expect(await store.load('guest')).toEqual({});
  });

  it('apply calls the real evaluateProgress and persists the result', async () => {
    const storage = fakeStorage();
    const store = new LocalStore(LOOKUP, storage);

    const p1 = await store.apply('guest', '山', { type: 'encounter', at: 0, sessionId: 's1' });
    expect(p1.encountered).toBe(true);
    expect(p1.status).toBe('new');

    // Persisted: a second store instance over the same storage sees it.
    const store2 = new LocalStore(LOOKUP, storage);
    const loaded = await store2.load('guest');
    expect(loaded['山']?.encountered).toBe(true);
  });

  it('apply is the only write path: state accumulates across calls for the same character', async () => {
    const storage = fakeStorage();
    const store = new LocalStore(LOOKUP, storage);
    await store.apply('guest', '山', { type: 'encounter', at: 0, sessionId: 's1' });
    await store.apply('guest', '山', { type: 'understand', at: 0, sessionId: 's1' });
    const p = await store.apply('guest', '山', {
      type: 'answer',
      at: 0,
      sessionId: 's1',
      itemId: 'i',
      lamp: 'reading',
      correct: true,
      mode: 'practice',
      surfaceId: 'r1',
      soft: false,
    });
    expect(p.lamps.reading).toBe(true);
    expect(p.status).toBe('new'); // meaning still unlit
  });

  it('a full session on requiredLamps caps at almost, never perfect (I7)', async () => {
    const storage = fakeStorage();
    const store = new LocalStore(LOOKUP, storage);
    await store.apply('guest', '山', { type: 'encounter', at: 0, sessionId: 's1' });
    await store.apply('guest', '山', { type: 'understand', at: 0, sessionId: 's1' });
    await store.apply('guest', '山', {
      type: 'answer', at: 0, sessionId: 's1', itemId: 'i', lamp: 'reading',
      correct: true, mode: 'practice', surfaceId: 'r1', soft: false,
    });
    const p = await store.apply('guest', '山', {
      type: 'answer', at: 0, sessionId: 's1', itemId: 'i', lamp: 'meaning',
      correct: true, mode: 'practice', surfaceId: 'm1', soft: false,
    });
    expect(p.status).toBe('almost');
  });

  it('different children are isolated', async () => {
    const storage = fakeStorage();
    const store = new LocalStore(LOOKUP, storage);
    await store.apply('alice', '山', { type: 'encounter', at: 0, sessionId: 's1' });
    const bobLoaded = await store.load('bob');
    expect(bobLoaded).toEqual({});
  });

  it('a corrupted stored entry is treated as a fresh start, not thrown', async () => {
    const storage = fakeStorage({ 'kanji-densha:v1:progress:guest': '{not valid json' });
    const store = new LocalStore(LOOKUP, storage);
    expect(await store.load('guest')).toEqual({});
    const p = await store.apply('guest', '山', { type: 'encounter', at: 0, sessionId: 's1' });
    expect(p.encountered).toBe(true);
  });

  it('a non-object stored entry (e.g. a JSON array) is treated as a fresh start', async () => {
    const storage = fakeStorage({ 'kanji-densha:v1:progress:guest': '[1,2,3]' });
    const store = new LocalStore(LOOKUP, storage);
    expect(await store.load('guest')).toEqual({});
  });
});
