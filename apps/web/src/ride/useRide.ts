// The session flow as a state machine mirroring the four beats (architecture
// §4), beat order enforced for a first-time character: each beat's own
// explicit continue action is the only thing that advances to the next, so
// the UI cannot reach 到着 without having passed through 出会う → わかる →
// ためす in order.
//
// store.apply is the only write path (I5) — this hook never constructs a
// CharacterProgress and never computes status itself. If a screen needs to
// know the status, it reads it from what apply() returned.
import { useState } from 'react';
import { LocalStore } from '@kanji-densha/store';
import type { CharacterProgress, ProgressEvent } from '@kanji-densha/engine';
import { contentLookup } from '../published/load.js';
import { getBrowserStorage, GUEST_CHILD_ID } from './storage.js';

export type Beat = 'encounter' | 'understand' | 'practice' | 'arrival';

export function useRide(characterId: string) {
  const [store] = useState(() => new LocalStore(contentLookup, getBrowserStorage()));
  const [sessionId] = useState(() => crypto.randomUUID());
  const [beat, setBeat] = useState<Beat>('encounter');
  const [progress, setProgress] = useState<CharacterProgress | null>(null);

  async function apply(event: ProgressEvent): Promise<CharacterProgress> {
    const next = await store.apply(GUEST_CHILD_ID, characterId, event);
    setProgress(next);
    return next;
  }

  return { sessionId, beat, setBeat, progress, apply };
}
