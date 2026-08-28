// D26: 学 shipped its real compound shape data (⺍+子), replacing M2's
// deliberately unpublished-shape record — the "honest-omission path" proof
// (D4: an unpublished shape produces no shape item, no apology, and still
// reaches teach_ready). That proof needed a home once 学 itself could no
// longer serve as the live example. fixtures/regression/ holds cases that
// must keep PASSING, the mirror image of fixtures/bad-content/.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { authoredCharacterSchema } from './schema.js';
import { teachReady } from './teach-ready.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('regression fixtures — must keep passing', () => {
  it('honest-omission-unpublished-shape.yaml parses and has no shape item', () => {
    const raw = parseYaml(readFileSync(join(repoRoot, 'fixtures/regression/honest-omission-unpublished-shape.yaml'), 'utf8'));
    const parsed = authoredCharacterSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.shape.published).toBe(false);
    expect(parsed.data.items.some((i) => i.lamp === 'shape')).toBe(false);

    // D21/D18: still reaches teach_ready once reading audio exists — shape
    // being unpublished is never itself an unmet checklist item (D4).
    const audioExists = (f: string) => f.startsWith('audio/readings/');
    const result = teachReady(parsed.data, audioExists);
    expect(result.ready).toBe(true);
  });
});
