// teach_ready checklist (spec §8.1). Pure: audio existence is passed in, not
// read here, so the gate owns the I/O and this stays testable.
//
// Most of the checklist — grade, ≥1 taught reading, meaning, ≥1 surface,
// encounter — is guaranteed by the schema, so a parsed record cannot fail those.
// The two the schema cannot guarantee are checked here: that the declared audio
// actually exists, and that the character has echo capability (a second surface
// or, later, a second sentence frame). In M2, audio never exists yet (D18), so
// every character is audio_pending and teach_ready is 0 — the gate working, not
// failing.
import type { AuthoredCharacter } from './schema.js';

export interface UnmetItem {
  readonly item: string;
  readonly satisfied_by: readonly string[];
}
export interface TeachReadyResult {
  readonly ready: boolean;
  readonly unmet: readonly UnmetItem[];
}

export function teachReady(
  char: AuthoredCharacter,
  audioExists: (filename: string) => boolean,
): TeachReadyResult {
  const unmet: UnmetItem[] = [];

  // Every declared audio file (taught readings + word surfaces) must exist.
  const declared = [
    ...char.taught_readings.entries.map((r) => r.audio),
    ...char.surfaces.map((s) => s.audio),
  ];
  const missing = [...new Set(declared.filter((f) => !audioExists(f)))];
  if (missing.length > 0) unmet.push({ item: 'audio', satisfied_by: missing });

  // Echo capability: a second surface (or, in a later milestone, a second
  // sentence frame). One-elementary-reading characters like 川 satisfy this by
  // varying the word surface, not the reading (D15).
  if (char.surfaces.length < 2) {
    unmet.push({ item: 'echo_capability', satisfied_by: ['a second word surface'] });
  }

  return { ready: unmet.length === 0, unmet };
}
