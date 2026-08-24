// The gate checks (architecture §2.2, README "what the gate must now do", D14).
// Pure: takes a parsed record, its reference readings, and an audioExists probe;
// returns hard errors (which block the build, naming file+field) and the
// teach_ready result (audio missing is not an error — it is audio_pending, D18).
import { teachReady } from '@kanji-densha/content-schema';
import type { AuthoredCharacter, UnmetItem } from '@kanji-densha/content-schema';
import type { CharReadings, Reading } from './reference.js';
import { readingKey } from './reference.js';

export interface GateError {
  readonly code: string;
  readonly file: string;
  readonly character: string;
  readonly field: string;
  readonly message: string;
}

export interface CharGateResult {
  readonly character: string;
  readonly file: string;
  readonly errors: readonly GateError[];
  readonly teach_ready: boolean;
  readonly unmet: readonly UnmetItem[];
  readonly elementary: readonly Reading[];
  readonly later: readonly Reading[];
}

export function gateCharacter(
  char: AuthoredCharacter,
  file: string,
  readings: CharReadings | undefined,
  audioExists: (filename: string) => boolean,
): CharGateResult {
  const errors: GateError[] = [];
  const err = (code: string, field: string, message: string) =>
    errors.push({ code, file, character: char.character, field, message });

  const elementary = readings?.elementary ?? [];
  const later = readings?.later ?? [];

  // The reference must know this character at all.
  if (readings === undefined) {
    err('unknown-kanji', 'character', `${char.character} is not in the reference table (content/reference/onkun-stage.json)`);
  } else if (readings.grade !== null && readings.grade !== char.grade) {
    // Declared grade must match the 学年別漢字配当表.
    err('grade-mismatch', 'grade', `${char.character}: declared grade ${char.grade} but the reference assigns it to grade ${readings.grade}`);
  }

  // D14 / I4: every taught reading must be an elementary reading in the table.
  const elementaryKeys = new Set(elementary.map((r) => readingKey(r.type, r.kana)));
  for (const tr of char.taught_readings) {
    if (!elementaryKeys.has(readingKey(tr.type, tr.kana))) {
      const asLater = later.find((r) => r.kana === tr.kana.normalize('NFC'));
      if (asLater !== undefined) {
        err(
          'later-reading',
          `taught_readings[${tr.id}]`,
          `${char.character}: taught reading ${tr.kana} (${tr.type}) is a ${asLater.stage} reading, not elementary — it may never light the reading lamp (I4)`,
        );
      } else {
        err(
          'not-elementary',
          `taught_readings[${tr.id}]`,
          `${char.character}: taught reading ${tr.kana} (${tr.type}) is not among the character's elementary readings in the reference table (D14)`,
        );
      }
    }
  }

  // Reading items and surfaces must resolve to a declared taught reading.
  const taughtIds = new Set(char.taught_readings.map((t) => t.id));
  for (const item of char.items) {
    if (item.type === 'reading_choice' && !taughtIds.has(item.reading_id)) {
      err('reading-item-unresolved', `items[${item.id}].reading_id`, `reading item ${item.id} references reading_id "${item.reading_id}", which is not a taught reading of ${char.character}`);
    }
  }
  for (const s of char.surfaces) {
    if (!taughtIds.has(s.reading_id)) {
      err('surface-unresolved', `surfaces[${s.id}].reading_id`, `surface ${s.id} references reading_id "${s.reading_id}", which is not a taught reading of ${char.character}`);
    }
  }

  // D4: an unpublished shape must produce no shape item (no lamp, no apology).
  if (!char.shape.published) {
    const shapeItem = char.items.find((i) => i.lamp === 'shape');
    if (shapeItem !== undefined) {
      err('shape-item-without-published-shape', `items[${shapeItem.id}]`, `${char.character}: shape is not published, so it must have no shape item (D4)`);
    }
  }

  // Stroke a11y names must be unique within a primitive (this was a shipped bug
  // on the sibling project — accessibility §6).
  if (char.shape.published && char.shape.kind === 'primitive') {
    const names = char.shape.strokes.map((s) => s.a11y_ja);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup !== undefined) {
      err('duplicate-a11y', 'shape.strokes', `${char.character}: stroke a11y name "${dup}" is used more than once; every stroke needs a unique accessible name`);
    }
  }

  const tr = teachReady(char, audioExists);
  return { character: char.character, file, errors, teach_ready: tr.ready, unmet: tr.unmet, elementary, later };
}
