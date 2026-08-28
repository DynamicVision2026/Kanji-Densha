// Authored-record schema (architecture §2.1, revised by D13/D14).
//
// The schema — not a later runtime check — is what makes an illegal record
// unparseable. It enforces: exactly one lamp per item (I1, a literal per item
// type, never an array); compound shapes require components and forbid a raw
// stroke list; meaning distractors are semantic and a kana-reading distractor is
// a parse error; every kanji/word string is NFC-normalised at the boundary.
//
// It does NOT carry elementary_readings/later_readings: those are generated from
// the reference table by the gate (D13). The author supplies taught_readings —
// the curated subset the reading lamp tests (D14) — and the gate verifies that
// subset against MEXT's own table.
import { z } from 'zod';

const nfc = (s: string) => s.normalize('NFC');
const nfcString = () => z.string().min(1).transform(nfc);

// D25: 'proper_name' covers characters whose only elementary-stage reading is a
// place-name entry in the reference table's appendix_2 (滋 in 滋賀, 阪 in 大阪, …) —
// no per-character on/kun breakdown exists for these, only the whole word's reading.
export const READING_TYPES = ['on', 'kun', 'proper_name'] as const;
export const STATUSES = ['draft', 'review', 'published'] as const;

// `audio` resolves against content/ (packages/content-build's audioExists),
// joined verbatim — an author-supplied `..` segment, an absolute path, or a
// symlink-like oddity could therefore walk out of content/ entirely,
// including into assets/audio-review/, the human-review staging area that
// must be structurally unreachable from a content record (D16 revised
// 2026-08-26). An earlier version of this rejected only `..` and a leading
// `/` — a denylist, which only ever blocks the cases someone thought of.
// This is an allowlist instead: match the one legitimate shape (exactly
// `audio/<category>/<filename>.mp3` or `.wav`) rather than exclude bad
// ones — every real record already looks like this, so nothing legitimate
// is newly rejected. Same principle as making an illegal record
// unparseable instead of pattern-matching known-illegal ones.
const AUDIO_PATH_RE = /^audio\/[^/]+\/[a-z0-9_-]+\.(mp3|wav)$/;

const audioFilename = () =>
  z.string().min(1).regex(AUDIO_PATH_RE, {
    message: 'audio must match audio/<category>/<filename>.mp3|.wav exactly (e.g. audio/readings/yama_kun.mp3)',
  });

// A taught reading (D14). `audio` is the intended filename; the file need not
// exist yet (D16/D18) — the gate turns a missing file into audio_pending.
export const taughtReadingSchema = z.strictObject({
  id: z.string().min(1),
  kana: nfcString(),
  type: z.enum(READING_TYPES),
  audio: audioFilename(),
});

// D19: the curated subset must record WHY it was chosen (`rationale`, one line)
// and WHICH taught reading justifies the character's grade placement (`anchor`).
// The anchor-must-be-a-taught-reading rule is structural — made unparseable here,
// not left to the gate — because it needs no data outside the record itself.
export const taughtReadingsSchema = z
  .strictObject({
    entries: z.array(taughtReadingSchema).min(1),
    rationale: z.string().min(1),
    anchor: z.string().min(1),
  })
  .refine((tr) => tr.entries.some((e) => e.id === tr.anchor), {
    message: 'anchor must reference an id present in entries (D19)',
    path: ['anchor'],
  });

export const surfaceSchema = z.strictObject({
  id: z.string().min(1),
  word: nfcString(),
  reading_id: z.string().min(1), // resolves to a taught_reading (gate)
  audio: audioFilename(),
});

// --- items: exactly one lamp each (I1), pinned by a literal per type -------
const readingItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('reading_choice'),
  lamp: z.literal('reading'),
  reading_id: z.string().min(1),
  choices: z.array(z.strictObject({ kana: nfcString(), correct: z.boolean() })).min(2),
});

// Meaning distractors are semantic (gloss/category). The strict shape + required
// `semantic: true` makes a kana-reading distractor a parse error: it would carry
// a `kana` field (rejected) or omit `semantic` (rejected).
const meaningItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('meaning_choice'),
  lamp: z.literal('meaning'),
  choices: z
    .array(z.strictObject({ gloss_ja: z.string().min(1), semantic: z.literal(true), correct: z.boolean() }))
    .min(2),
});

const clozeItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('cloze'), // 選字填空
  lamp: z.literal('shape'),
  phrase_ja: z.string().min(1),
  choices: z.array(z.strictObject({ kanji: nfcString(), correct: z.boolean() })).min(2),
});

const strokeOrderItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('stroke_order'),
  lamp: z.literal('shape'),
});

const componentAssemblyItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('component_assembly'),
  lamp: z.literal('shape'),
});

const confusableItemSchema = z.strictObject({
  id: z.string().min(1),
  type: z.literal('confusable'), // 似た駅名 — soft; repairs shape, never lights (D9)
  lamp: z.literal('shape'),
  soft: z.literal(true),
});

export const itemSchema = z.discriminatedUnion('type', [
  readingItemSchema,
  meaningItemSchema,
  clozeItemSchema,
  strokeOrderItemSchema,
  componentAssemblyItemSchema,
  confusableItemSchema,
]);

// --- shape: primitive→strokes, compound→components ------------------------
const strokeSchema = z.strictObject({
  order: z.number().int().positive(),
  type: z.string().min(1),
  a11y_ja: z.string().min(1), // unique within a character (gate check)
});
// An unpublished shape carries NO stroke/component data — the shape is honestly
// absent, not a stub (D4). A published shape is either a primitive (strokes) or a
// compound (components), never both.
const unpublishedShapeSchema = z.strictObject({ published: z.literal(false) });
const publishedPrimitiveSchema = z.strictObject({
  published: z.literal(true),
  kind: z.literal('primitive'),
  strokes: z.array(strokeSchema).min(1),
});
const publishedCompoundSchema = z.strictObject({
  published: z.literal(true),
  kind: z.literal('compound'),
  components: z.array(z.strictObject({ char: nfcString(), role: z.string().min(1).optional() })).min(2),
});
export const shapeSchema = z.union([
  unpublishedShapeSchema,
  z.discriminatedUnion('kind', [publishedPrimitiveSchema, publishedCompoundSchema]),
]);

export const encounterSchema = z
  .strictObject({
    art: z.string().min(1).nullable(),
    template: z.string().min(1).nullable(),
    copy_ja: z.string().min(1),
  })
  .refine((e) => (e.art === null) !== (e.template === null), {
    message: 'encounter must set exactly one of art or template',
  });

export const meaningSchema = z.strictObject({
  gloss_ja: z.string().min(1),
  category: z.string().min(1),
});

export const authoredCharacterSchema = z.strictObject({
  character: nfcString(),
  grade: z.number().int().min(1).max(6),
  taught_readings: taughtReadingsSchema,
  meaning: meaningSchema,
  encounter: encounterSchema,
  surfaces: z.array(surfaceSchema).min(1),
  shape: shapeSchema,
  items: z.array(itemSchema).min(1),
  lines: z.array(z.string().min(1)).default([]),
  status: z.enum(STATUSES),
});

export type AuthoredCharacter = z.infer<typeof authoredCharacterSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Shape = z.infer<typeof shapeSchema>;
export type TaughtReading = z.infer<typeof taughtReadingSchema>;
export type TaughtReadings = z.infer<typeof taughtReadingsSchema>;
