// LocalStore — the guest-mode ProgressStore adapter (architecture §3). Backed
// by any StorageLike (real `localStorage` in the browser, an in-memory fake in
// tests). `apply` is the only write path: it loads, calls the SAME
// evaluateProgress every adapter calls (I5), and persists the result.
import { evaluateProgress, initialProgress } from '@kanji-densha/engine';
import type { CharacterProgress, ProgressEvent } from '@kanji-densha/engine';
import type { ContentLookup, ProgressStore, StorageLike } from './types.js';

const KEY_PREFIX = 'kanji-densha:v1:progress:';

function keyFor(childId: string): string {
  return `${KEY_PREFIX}${childId}`;
}

/**
 * Reads and parses the stored progress map for a child. A missing or
 * corrupted entry is treated as a fresh start rather than thrown — localStorage
 * content is the one boundary in this app that TypeScript cannot guarantee,
 * and a corrupted entry must never crash the child's screen.
 */
function readAll(storage: StorageLike, childId: string): Record<string, CharacterProgress> {
  const raw = storage.getItem(keyFor(childId));
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, CharacterProgress>;
    }
    return {};
  } catch {
    return {};
  }
}

export class LocalStore implements ProgressStore {
  private readonly lookup: ContentLookup;
  private readonly storage: StorageLike;

  constructor(lookup: ContentLookup, storage: StorageLike) {
    this.lookup = lookup;
    this.storage = storage;
  }

  async load(childId: string): Promise<Record<string, CharacterProgress>> {
    return readAll(this.storage, childId);
  }

  async apply(childId: string, characterId: string, event: ProgressEvent): Promise<CharacterProgress> {
    const all = readAll(this.storage, childId);
    const previous = all[characterId] ?? initialProgress(characterId);
    const params = this.lookup.getGradeParams(characterId);
    const requiredLamps = this.lookup.getRequiredLamps(characterId);

    const next = evaluateProgress(previous, event, params, requiredLamps);

    all[characterId] = next;
    this.storage.setItem(keyFor(childId), JSON.stringify(all));
    return next;
  }
}
