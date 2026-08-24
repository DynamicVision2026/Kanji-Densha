// packages/content-schema — Zod schemas, teach_ready, and the reading-resolution
// types the gate checks records against (architecture §2).
export {
  authoredCharacterSchema,
  itemSchema,
  shapeSchema,
  taughtReadingSchema,
  taughtReadingsSchema,
  surfaceSchema,
  meaningSchema,
  encounterSchema,
  READING_TYPES,
  STATUSES,
} from './schema.js';
export type { AuthoredCharacter, Item, Shape, TaughtReading, TaughtReadings } from './schema.js';
export { teachReady } from './teach-ready.js';
export type { TeachReadyResult, UnmetItem } from './teach-ready.js';
