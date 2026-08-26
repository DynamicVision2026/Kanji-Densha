#!/usr/bin/env node
// 山 audio pilot — talks to a locally running VOICEVOX engine over its HTTP
// API (docs/audio-yama-pilot brief; docs/licenses.md "Audio — D16 revised
// 2026-08-26"). This is the half of the pilot that runs on the architect's
// Mac, not in Claude Code's sandbox — see scripts/audio/README.md for why.
//
// Scope is fixed to the 山 content record's own declared readings and
// surfaces (content-dist/g1.json). This script does not invent text: it
// reads exactly what the record already carries.
//
// Dependency-free (global fetch, node:crypto, node:fs) so it runs with
// nothing but `node` on a machine that has not run `pnpm install` for this
// monorepo — a VOICEVOX pilot script has no business requiring a workspace
// install to run.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateManifest } from './manifest-schema.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(repoRoot, 'assets', 'audio-review', 'yama-pilot');
const g1Path = join(repoRoot, 'content-dist', 'g1.json');

const TARGET_KANJI = '山';
const ENGINE = 'VOICEVOX';
const VOICE_LIBRARY = 'VOICEVOX Nemo';
const ATTRIBUTION = 'VOICEVOX:Nemo';
// Kept in lockstep with docs/licenses.md "Audio — D16 (revised 2026-08-26)"
// § Terms as recorded. If you re-check the terms, update both places.
const TERMS_URLS = ['https://voicevox.hiroshiba.jp/term/', 'https://voicevox.hiroshiba.jp/nemo/term/'];
const TERMS_CHECKED_DATE = '2026-08-26';
const DEFAULT_SPEED_SCALE = 0.95; // slightly below 1.0 — the listener is six

function parseArgs(argv) {
  const args = { host: process.env.VOICEVOX_HOST ?? 'http://127.0.0.1:50021', speed: DEFAULT_SPEED_SCALE };
  for (const raw of argv) {
    const [key, ...rest] = raw.replace(/^--/, '').split('=');
    const value = rest.join('=');
    switch (key) {
      case 'list-speakers':
        args.listSpeakers = true;
        break;
      case 'speaker-id':
        args.speakerId = Number(value);
        break;
      case 'cv-name':
        args.cvName = value;
        break;
      case 'host':
        args.host = value;
        break;
      case 'speed':
        args.speed = Number(value);
        break;
      case 'only':
        args.only = value; // taught_reading_id or word_surface_id
        break;
      case 'from-query':
        args.fromQuery = value; // path to a saved/corrected AudioQuery JSON, used with --only
        break;
      case 'batch-id':
        args.batchId = value;
        break;
      default:
        console.error(`unrecognised flag: --${key}`);
        process.exit(1);
    }
  }
  return args;
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function requireEngine(host) {
  let version;
  try {
    const res = await fetch(`${host}/version`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    version = await res.json();
  } catch (err) {
    fail(
      `Cannot reach a VOICEVOX engine at ${host}.\n` +
        `  - Is the VOICEVOX desktop app open? The engine's HTTP API only runs while the app is running.\n` +
        `  - Confirm the port: some versions/installs use a different port than 50021 — check the app's\n` +
        `    settings, or pass --host=http://127.0.0.1:<port>.\n` +
        `  - Underlying error: ${err.message}\n\n` +
        `Do not substitute a different TTS to get unblocked — that is out of scope for this pilot.`,
    );
  }
  return version;
}

async function listSpeakers(host) {
  const res = await fetch(`${host}/speakers`);
  if (!res.ok) fail(`GET /speakers failed: HTTP ${res.status}`);
  return res.json();
}

async function findSpeaker(host, speakerId) {
  const speakers = await listSpeakers(host);
  for (const speaker of speakers) {
    for (const style of speaker.styles ?? []) {
      if (style.id === speakerId) return { speakerName: speaker.name, styleName: style.name };
    }
  }
  return null;
}

function loadYamaRecord() {
  if (!existsSync(g1Path)) {
    fail(`${g1Path} does not exist — run \`pnpm content:build\` first so content-dist/g1.json exists.`);
  }
  const g1 = JSON.parse(readFileSync(g1Path, 'utf8'));
  const chars = Array.isArray(g1) ? g1 : (g1.characters ?? []);
  const record = chars.find((c) => c && c.character === TARGET_KANJI);
  if (!record) fail(`${TARGET_KANJI} not found in content-dist/g1.json.`);
  return record;
}

// Fixed pilot set — exactly the record's own taught readings and surfaces.
// Nothing invented: this is the same set content-dist/g1.json's own
// audio_pending.satisfied_by already names as the intended files.
function pilotItems(record) {
  const items = [];
  for (const r of record.taught_readings.entries) {
    items.push({
      id: r.id,
      sourceText: r.kana,
      taughtReadingId: r.id,
      wordSurfaceId: null,
      kind: 'citation-reading',
    });
  }
  for (const s of record.surfaces) {
    items.push({
      id: s.id,
      sourceText: s.word,
      taughtReadingId: s.reading_id,
      wordSurfaceId: s.id,
      kind: 'word-surface',
    });
  }
  return items;
}

async function synthesizeOne(host, speakerId, item, speed, fromQueryPath) {
  let audioQuery;
  if (fromQueryPath) {
    audioQuery = JSON.parse(readFileSync(fromQueryPath, 'utf8'));
  } else {
    const url = `${host}/audio_query?text=${encodeURIComponent(item.sourceText)}&speaker=${speakerId}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) fail(`POST /audio_query failed for "${item.sourceText}": HTTP ${res.status}`);
    audioQuery = await res.json();
    audioQuery.speedScale = speed;
  }

  const synthUrl = `${host}/synthesis?speaker=${speakerId}`;
  const synthRes = await fetch(synthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(audioQuery),
  });
  if (!synthRes.ok) fail(`POST /synthesis failed for "${item.sourceText}": HTTP ${synthRes.status}`);
  const wavBuffer = Buffer.from(await synthRes.arrayBuffer());
  return { audioQuery, wavBuffer };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.listSpeakers) {
    const speakers = await listSpeakers(args.host).catch(() => null);
    if (!speakers) await requireEngine(args.host); // will fail loudly with the real reason
    for (const speaker of speakers) {
      console.log(`${speaker.name}  (uuid ${speaker.speaker_uuid})`);
      for (const style of speaker.styles ?? []) {
        console.log(`  --speaker-id=${style.id}   style: ${style.name}`);
      }
    }
    console.log('\nFind the Nemo entry above, then re-run with --speaker-id=<id>.');
    return;
  }

  if (!Number.isFinite(args.speakerId)) {
    fail('Missing --speaker-id. Run `node generate-pilot.mjs --list-speakers` first to find Nemo\'s id.');
  }

  const engineVersion = await requireEngine(args.host);
  const speakerInfo = await findSpeaker(args.host, args.speakerId);
  if (!speakerInfo) fail(`--speaker-id=${args.speakerId} was not found in /speakers. Run --list-speakers to check.`);

  const record = loadYamaRecord();
  const allItems = pilotItems(record);
  const items = args.only ? allItems.filter((i) => i.id === args.only) : allItems;
  if (items.length === 0) fail(`--only=${args.only} matched no pilot item. Known ids: ${allItems.map((i) => i.id).join(', ')}`);
  if (args.fromQuery && items.length !== 1) fail('--from-query requires exactly one item — pair it with --only=<id>.');

  mkdirSync(outDir, { recursive: true });

  const manifestPath = join(outDir, 'manifest.json');
  const existingManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: [] };
  const batchId = args.batchId ?? `yama-pilot-${new Date().toISOString().slice(0, 10)}`;

  const newEntries = [];
  for (const item of items) {
    console.log(`Synthesizing ${item.id} ("${item.sourceText}", ${item.kind})...`);
    const { audioQuery, wavBuffer } = await synthesizeOne(
      args.host,
      args.speakerId,
      item,
      args.speed,
      args.fromQuery,
    );
    const sha256 = createHash('sha256').update(wavBuffer).digest('hex');
    const fileName = `${item.id}.wav`;
    const filePath = `assets/audio-review/yama-pilot/${fileName}`;
    writeFileSync(join(outDir, fileName), wavBuffer);

    newEntries.push({
      batch_id: batchId,
      engine: ENGINE,
      engine_version: typeof engineVersion === 'string' ? engineVersion : JSON.stringify(engineVersion),
      voice_library: VOICE_LIBRARY,
      speaker_name: `${speakerInfo.speakerName} (${speakerInfo.styleName})`,
      speaker_id: args.speakerId,
      generated_at: new Date().toISOString(),
      source_text: item.sourceText,
      target_kanji: TARGET_KANJI,
      taught_reading_id: item.taughtReadingId,
      word_surface_id: item.wordSurfaceId,
      generation_params: { speedScale: args.speed, cv_name: args.cvName ?? null },
      audio_query: audioQuery,
      file_path: filePath,
      sha256,
      terms_urls: TERMS_URLS,
      terms_checked_date: TERMS_CHECKED_DATE,
      attribution: ATTRIBUTION,
    });
    console.log(`  -> ${filePath} (sha256 ${sha256.slice(0, 12)}…)`);
  }

  // Replace-by-id: a regenerated file (--only + --from-query) supersedes the
  // prior entry for that id rather than duplicating it. The unique key is
  // word_surface_id when the entry is a word-surface file, else
  // taught_reading_id — NOT the reverse: taught_reading_id is set on BOTH
  // kinds of entry (a surface's own reading), so keying on it alone collides
  // a surface with its underlying citation reading (e.g. kazan_1's
  // taught_reading_id is san_on, same as san_on's own citation entry).
  const entryKey = (f) => (f.word_surface_id === null ? f.taught_reading_id : f.word_surface_id);
  const byId = new Map(existingManifest.files.map((f) => [entryKey(f), f]));
  for (const entry of newEntries) {
    byId.set(entryKey(entry), entry);
  }
  const manifest = { files: [...byId.values()] };

  const { ok, errors } = validateManifest(manifest);
  if (!ok) {
    fail(`Generated manifest failed its own schema check — nothing written.\n  - ${errors.join('\n  - ')}`);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✓ Wrote ${manifestPath} (${manifest.files.length} file(s) total).`);
  console.log(`  cv_name was ${args.cvName ? 'recorded' : 'left blank — fill it in from VOICEVOX\'s credit page if required'}.`);
  console.log('  Next: archive the two terms pages under assets/audio-review/yama-pilot/terms/');
  console.log('  (see that directory\'s README), then have a native speaker fill out REVIEW.md.');
}

main();
