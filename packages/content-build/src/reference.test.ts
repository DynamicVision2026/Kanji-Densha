// D25: appendix_2 (place-name readings with no per-character on/kun breakdown)
// is the only elementary-stage reading some characters have at all. Verifies
// loadReference actually surfaces it, against the real national reference file
// — not a fixture — since the whole point is whether the real table has it.
import { describe, it, expect } from 'vitest';
import { loadReference, readingKey } from './reference.js';

const repoRoot = new URL('../../../', import.meta.url).pathname;

describe('loadReference — D25 appendix_2', () => {
  const ref = loadReference(repoRoot);

  it('gives 媛/岐/滋/阪 a proper_name elementary reading from 愛媛/岐阜/滋賀/大阪', () => {
    const expected: Record<string, string> = { 媛: 'えひめ', 岐: 'ぎふ', 滋: 'しが', 阪: 'おおさか' };
    for (const [char, kana] of Object.entries(expected)) {
      const readings = ref.get(char);
      expect(readings).toBeDefined();
      const keys = readings!.elementary.map((r) => readingKey(r.type, r.kana));
      expect(keys).toContain(readingKey('proper_name', kana));
    }
  });

  it('does not touch main_table-derived readings for characters that already have one', () => {
    // 愛 has a real elementary on-reading (アイ) independent of the 愛媛 appendix row.
    const readings = ref.get('愛');
    expect(readings?.elementary.some((r) => r.type === 'on' && r.kana === 'アイ')).toBe(true);
  });

  it('still leaves 媛/岐/滋/阪\'s main_table on-reading classified as later (junior_high)', () => {
    const laterOn: Record<string, string> = { 媛: 'エン', 岐: 'キ', 滋: 'ジ', 阪: 'ハン' };
    for (const [char, kana] of Object.entries(laterOn)) {
      const readings = ref.get(char);
      expect(readings!.later.some((r) => r.type === 'on' && r.kana === kana)).toBe(true);
    }
  });
});
