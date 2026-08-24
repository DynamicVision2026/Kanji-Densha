// `pnpm content:build` — parse → validate → cross-reference → gate → emit
// (architecture §2.2). Published-only output (I2). In M2 the milestone PASSES
// with teach_ready: 0 and every character audio_pending (D18): a missing audio
// file is a pending checklist item named in the manifest, not a build error.
// Hard errors (schema violations, a taught reading that is not elementary, an
// unresolved reference) DO fail the build, naming the file and field.
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { authoredCharacterSchema } from '@kanji-densha/content-schema';
import type { AuthoredCharacter } from '@kanji-densha/content-schema';
import { loadReference, repoRootFrom } from './reference.js';
import { gateCharacter } from './gate.js';
import type { GateError, GateErrorCode } from './gate.js';

// Build-level errors happen before a record even reaches the gate (a YAML parse
// failure, or a schema rejection with its Zod issue path) — 'yaml-parse' and
// 'schema' are not gate.ts error codes and are deliberately excluded from
// GATE_ERROR_CODES, which the rejection suite's completeness check iterates.
type BuildErrorCode = GateErrorCode | 'yaml-parse' | 'schema';
interface BuildError extends Omit<GateError, 'code'> {
  readonly code: BuildErrorCode;
}

const repoRoot = repoRootFrom(import.meta.url);
const charactersDir = join(repoRoot, 'content/characters');
const audioRoot = join(repoRoot, 'content');
const distDir = join(repoRoot, 'content-dist');

function findRecords(): string[] {
  if (!existsSync(charactersDir)) return [];
  return readdirSync(charactersDir, { recursive: true })
    .map((p) => String(p))
    .filter((p) => p.endsWith('.yaml') || p.endsWith('.yml'))
    .map((p) => join(charactersDir, p))
    .sort();
}

function audioExists(filename: string): boolean {
  const p = join(audioRoot, filename);
  return existsSync(p) && statSync(p).size > 0;
}

function perGradeTotals(): Record<string, number> {
  const doc = JSON.parse(readFileSync(join(repoRoot, 'content/reference/onkun-stage.json'), 'utf8')) as {
    totals: { per_grade: Record<string, number> };
  };
  return doc.totals.per_grade; // I9: the denominator comes from the reference, never a constant
}

function main(): void {
  const reference = loadReference(repoRoot);
  const gradeTotals = perGradeTotals();
  const files = findRecords();

  const hardErrors: BuildError[] = [];
  const published: {
    file: string;
    char: AuthoredCharacter;
    teach_ready: boolean;
    unmet: readonly { item: string; satisfied_by: readonly string[] }[];
    elementary: readonly { kana: string; type: string }[];
    later: readonly { kana: string; type: string }[];
  }[] = [];

  for (const file of files) {
    const rel = relative(repoRoot, file);
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(file, 'utf8'));
    } catch (e) {
      hardErrors.push({ code: 'yaml-parse', file: rel, character: '?', field: '(document)', message: `YAML parse error: ${(e as Error).message}` });
      continue;
    }
    const parsed = authoredCharacterSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        hardErrors.push({ code: 'schema', file: rel, character: String((raw as { character?: string })?.character ?? '?'), field: issue.path.join('.') || '(root)', message: issue.message });
      }
      continue;
    }
    const char = parsed.data;
    const result = gateCharacter(char, rel, reference.get(char.character), audioExists);
    hardErrors.push(...result.errors);

    if (char.status === 'published' && result.errors.length === 0) {
      published.push({
        file: rel,
        char,
        teach_ready: result.teach_ready,
        unmet: result.unmet,
        elementary: result.elementary.map((r) => ({ kana: r.kana, type: r.type })),
        later: result.later.map((r) => ({ kana: r.kana, type: r.type })),
      });
    }
  }

  if (hardErrors.length > 0) {
    console.error(`✗ content:build FAILED — ${hardErrors.length} error(s):\n`);
    for (const e of hardErrors) console.error(`  [${e.code}] ${e.file} · ${e.character} · ${e.field}\n      ${e.message}`);
    process.exit(1);
  }

  // --- emit (published only, I2) ------------------------------------------
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  const byGrade = new Map<number, typeof published>();
  for (const p of published) {
    const g = p.char.grade;
    const list = byGrade.get(g) ?? [];
    list.push(p);
    byGrade.set(g, list);
  }

  const gradesManifest: Record<string, unknown> = {};
  const pending: Record<string, unknown> = {};
  const audioManifest: string[] = [];

  for (const [grade, list] of [...byGrade.entries()].sort((a, b) => a[0] - b[0])) {
    const bundle = list.map((p) => ({
      character: p.char.character,
      grade: p.char.grade,
      taught_readings: p.char.taught_readings,
      meaning: p.char.meaning,
      encounter: p.char.encounter,
      surfaces: p.char.surfaces,
      shape: p.char.shape,
      items: p.char.items,
      lines: p.char.lines,
      elementary_readings: p.elementary, // generated (D13)
      later_readings: p.later, // generated; no item may reference these (I4)
      teach_ready: p.teach_ready,
      audio_pending: p.unmet,
    }));
    writeFileSync(join(distDir, `g${grade}.json`), `${JSON.stringify(bundle, null, 2)}\n`);

    const teachReadyCount = list.filter((p) => p.teach_ready).length;
    gradesManifest[`g${grade}`] = {
      grade_total: gradeTotals[String(grade)] ?? null, // I9
      teach_ready: teachReadyCount,
      published: list.length,
      characters: list.map((p) => ({ character: p.char.character, teach_ready: p.teach_ready, unmet: p.unmet })),
    };
    for (const p of list) {
      if (p.unmet.length > 0) pending[p.char.character] = p.unmet;
      for (const a of [...p.char.taught_readings.entries.map((r) => r.audio), ...p.char.surfaces.map((s) => s.audio)]) {
        if (audioExists(a) && !audioManifest.includes(a)) audioManifest.push(a);
      }
    }
  }

  const contentHash = createHash('sha256')
    .update([...byGrade.keys()].sort((a, b) => a - b).map((g) => readFileSync(join(distDir, `g${g}.json`), 'utf8')).join(''))
    .digest('hex');

  const manifest = {
    content_hash: contentHash,
    grades: gradesManifest,
    audio_manifest: audioManifest.sort(), // I10: a speaker renders only if its file is here
    pending, // the work order: per character, the unmet item(s) and the file(s) that would satisfy them
  };
  writeFileSync(join(distDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const totalTeachReady = published.filter((p) => p.teach_ready).length;
  console.log(`✓ content:build ok — ${published.length} published record(s), teach_ready ${totalTeachReady}`);
  for (const [g, m] of Object.entries(gradesManifest)) {
    const mm = m as { teach_ready: number; grade_total: number | null; published: number };
    console.log(`    ${g}: teach_ready ${mm.teach_ready}/${mm.grade_total} (${mm.published} published)`);
  }
  if (Object.keys(pending).length > 0) {
    console.log(`    pending: ${Object.keys(pending).length} character(s) await audio (see manifest.pending)`);
  }
}

main();
