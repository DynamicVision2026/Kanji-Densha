// The rejection suite (M2 Part 4). Every fixture in fixtures/bad-content/ is
// deliberately invalid, one gate rule or schema constraint per file. The prefix
// before "--" in the filename names the expected failure: "schema" for a Zod
// parse failure, or a specific gate error code (gate.ts) for a record that
// parses but fails cross-reference against the national table. A gate that
// rejects for the wrong reason is a gate that will pass the wrong record later
// — so each fixture asserts WHICH error fires, not just that something did.
//
// The completeness check below derives its expected-code list from
// GATE_ERROR_CODES (gate.ts's own exported array), not a second hand-typed
// copy. A hand-typed copy is exactly how this check went vacuously green once
// already — a mismatch between filenames and gate.ts codes did not fail the
// build because the check trusted filenames as its own source of truth. It now
// asserts against the gate itself, so it cannot drift from it again.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { authoredCharacterSchema } from '@kanji-densha/content-schema';
import { gateCharacter, GATE_ERROR_CODES, loadReference } from '@kanji-densha/content-build';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = join(repoRoot, 'fixtures/bad-content');
const reference = loadReference(repoRoot);

const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.yaml'));

// "schema--..." -> "schema"; "gate-<code>--..." -> "<code>" (gate.ts error codes).
function expectedCodeFor(filename: string): string {
  const prefix = filename.split('--')[0] ?? '';
  return prefix === 'schema' ? 'schema' : prefix.replace(/^gate-/, '');
}

describe('bad-content rejection suite', () => {
  it('every code the gate can produce, plus schema, has a fixture', () => {
    const expectedCodes: string[] = ['schema', ...GATE_ERROR_CODES];
    const present = new Set(files.map(expectedCodeFor));
    for (const code of expectedCodes) expect(present.has(code)).toBe(true);
  });

  for (const file of files.sort()) {
    const expectedCode = expectedCodeFor(file);

    it(`${file} is rejected, naming "${expectedCode}"`, () => {
      const raw = parseYaml(readFileSync(join(fixturesDir, file), 'utf8'));
      const parsed = authoredCharacterSchema.safeParse(raw);

      if (expectedCode === 'schema') {
        expect(parsed.success).toBe(false);
        return;
      }

      // Must parse cleanly — this fixture tests the GATE, not the schema.
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const char = parsed.data;
      const result = gateCharacter(char, file, reference.get(char.character), () => false);
      const codes = result.errors.map((e) => e.code);
      expect(codes).toContain(expectedCode);
    });
  }
});
