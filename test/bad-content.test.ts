// The rejection suite (M2 Part 4). Every fixture in fixtures/bad-content/ is
// deliberately invalid, one gate rule or schema constraint per file. The prefix
// before "--" in the filename names the expected failure: "schema" for a Zod
// parse failure, or a specific gate error code (gate.ts) for a record that
// parses but fails cross-reference against the national table. A gate that
// rejects for the wrong reason is a gate that will pass the wrong record later
// — so each fixture asserts WHICH error fires, not just that something did.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { authoredCharacterSchema } from '../packages/content-schema/src/schema';
import { gateCharacter } from '../packages/content-build/src/gate';
import { loadReference } from '../packages/content-build/src/reference';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = join(repoRoot, 'fixtures/bad-content');
const reference = loadReference(repoRoot);

const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.yaml'));

describe('bad-content rejection suite', () => {
  it('every rule declared in this milestone has a fixture', () => {
    const expectedCodes = [
      'schema',
      'unknown-kanji',
      'grade-mismatch',
      'later-reading',
      'not-elementary',
      'reading-item-unresolved',
      'surface-unresolved',
      'duplicate-a11y',
      'shape-item-without-published-shape',
    ];
    const present = new Set(
      files.map((f) => {
        const prefix = f.split('--')[0] ?? '';
        return prefix === 'schema' ? 'schema' : prefix.replace(/^gate-/, '');
      }),
    );
    for (const code of expectedCodes) expect(present.has(code)).toBe(true);
  });

  for (const file of files.sort()) {
    // "schema--..." -> "schema"; "gate-<code>--..." -> "<code>" (gate.ts error codes).
    const prefix = file.split('--')[0] ?? '';
    const expectedCode = prefix === 'schema' ? 'schema' : prefix.replace(/^gate-/, '');

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
