// The persistence boundary contract (architecture §3). Two implementations
// share it: LocalStore (localStorage, guest — this milestone) and RemoteStore
// (Better Auth + PGLite/Neon — M7). Both call the same evaluateProgress (I5).
// `apply` is the only write path; the UI never constructs a CharacterProgress
// by hand.
import type { CharacterProgress, GradeParams, Lamp, ProgressEvent } from '@kanji-densha/engine';

/**
 * One session's summary. Feeds the parent "weekly activity" surface (M6) and
 * has no consumer yet in M3 — deliberately not implemented by LocalStore this
 * milestone (M3 is guest mode only, no route map, no echo scheduling). Kept
 * minimal rather than designed against a UI that doesn't exist yet.
 */
export interface SessionSummary {
  readonly sessionId: string;
  readonly startedAt: number;
}

export interface ProgressStore {
  load(childId: string): Promise<Record<string, CharacterProgress>>;
  apply(childId: string, characterId: string, event: ProgressEvent): Promise<CharacterProgress>;
  listSessions?(childId: string): Promise<SessionSummary[]>;
}

/**
 * A content fact `apply` needs but does not own: which grade's parameters
 * govern a character, and which lamps are required for it (D4 — derived from
 * whether the character's shape is published). `apply`'s signature is fixed by
 * architecture §3 with no extra parameters, so the store is constructed with a
 * lookup rather than being handed this per call. The real implementation reads
 * content-dist/ (I2); tests supply a fake.
 */
export interface ContentLookup {
  getGradeParams(characterId: string): GradeParams;
  getRequiredLamps(characterId: string): readonly Lamp[];
}

/** Minimal subset of the DOM `Storage` interface — no `dom` lib dependency. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
