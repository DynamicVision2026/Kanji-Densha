// Batch manifest schema for the VOICEVOX audio pilot (docs/licenses.md,
// "Audio — D16 (revised 2026-08-26)", § Batch manifest — required fields).
//
// Dependency-free on purpose: this runs on the architect's Mac via plain
// `node`, not inside the monorepo's pnpm workspace, so it cannot assume
// `zod` (a workspace-scoped devDependency of packages/content-schema) is
// resolvable here.
//
// `audio_query` is the field most likely to be shortcut under time pressure
// and the one the licence register calls out as mattering most: it is the
// only place a native reviewer's accent correction lives. Validated as
// "present and a non-null object", not deep-validated against VOICEVOX's own
// AudioQuery shape — that shape is the engine's contract, not this script's
// to duplicate or drift from.

export const REQUIRED_FIELDS = [
  'batch_id',
  'engine',
  'engine_version',
  'voice_library',
  'speaker_name',
  'speaker_id',
  'generated_at',
  'source_text',
  'target_kanji',
  'taught_reading_id',
  'word_surface_id', // nullable — null for a citation-reading file, not omitted
  'generation_params',
  'audio_query',
  'file_path',
  'sha256',
  'terms_urls',
  'terms_checked_date',
  'attribution',
];

// Fields that may be `null` rather than merely non-empty. Every other
// required field must be present AND non-empty/non-null.
const NULLABLE_FIELDS = new Set(['word_surface_id']);

const SHA256_RE = /^[a-f0-9]{64}$/;

// Output location must stay inside assets/audio-review/ (the brief's step 4:
// "structurally incapable of reaching a child"). The content-schema fix
// (packages/content-schema/src/schema.ts) blocks the other direction — a
// content record cannot reach into assets/audio-review/ — this checks that
// the manifest itself never claims a file_path outside review staging.
const REVIEW_ROOT_PREFIX = 'assets/audio-review/';

export function validateManifestEntry(entry) {
  const errors = [];

  if (entry === null || typeof entry !== 'object') {
    return { ok: false, errors: ['entry is not an object'] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      errors.push(`missing required field: ${field}`);
      continue;
    }
    const value = entry[field];
    if (value === undefined) {
      errors.push(`field present but undefined: ${field}`);
      continue;
    }
    if (value === null && !NULLABLE_FIELDS.has(field)) {
      errors.push(`field must not be null: ${field}`);
      continue;
    }
    if (typeof value === 'string' && value.trim() === '' && !NULLABLE_FIELDS.has(field)) {
      errors.push(`field must not be empty: ${field}`);
    }
  }

  if (typeof entry.audio_query === 'object' && entry.audio_query !== null) {
    if (Array.isArray(entry.audio_query) || Object.keys(entry.audio_query).length === 0) {
      errors.push('audio_query must be the full AudioQuery object returned by /audio_query, not an array or empty object');
    }
  } else if ('audio_query' in entry) {
    errors.push('audio_query must be an object (the complete AudioQuery JSON, not a summary of it)');
  }

  if (typeof entry.sha256 === 'string' && !SHA256_RE.test(entry.sha256)) {
    errors.push(`sha256 is not a 64-hex-character digest: ${entry.sha256}`);
  }

  if (!Array.isArray(entry.terms_urls) || entry.terms_urls.length < 2) {
    errors.push('terms_urls must list both the engine terms page and the Nemo terms page');
  }

  if (typeof entry.file_path === 'string' && !entry.file_path.startsWith(REVIEW_ROOT_PREFIX)) {
    errors.push(`file_path must stay under ${REVIEW_ROOT_PREFIX}, got: ${entry.file_path}`);
  }

  if (entry.word_surface_id === null && entry.taught_reading_id == null) {
    errors.push('taught_reading_id is required even for a word-surface file (the reading it was generated under)');
  }

  return { ok: errors.length === 0, errors };
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.files)) {
    return { ok: false, errors: ['manifest must be an object with a "files" array'] };
  }
  const allErrors = [];
  manifest.files.forEach((entry, i) => {
    const { ok, errors } = validateManifestEntry(entry);
    if (!ok) allErrors.push(...errors.map((e) => `files[${i}] (${entry?.file_path ?? '?'}): ${e}`));
  });
  return { ok: allErrors.length === 0, errors: allErrors };
}
