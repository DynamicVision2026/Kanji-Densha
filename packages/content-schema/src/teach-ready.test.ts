// D21: teach_ready's audio check was stricter than spec §8.1 — it required
// audio for word surfaces as well as elementary readings, but §8.1's checklist
// lists "fixed audio for those readings" and, separately, "word surfaces /
// echo capability" with no audio attached to the second line. This asserts
// the corrected rule directly so it cannot drift back to the stricter (or a
// looser) version by accident.
import { describe, it, expect } from 'vitest';
import { authoredCharacterSchema } from './schema';
import { teachReady } from './teach-ready';

function baseRecord(): unknown {
  return {
    character: '山',
    grade: 1,
    taught_readings: {
      entries: [{ id: 'yama', kana: 'やま', type: 'kun', audio: 'audio/readings/yama.mp3' }],
      rationale: 'test fixture',
      anchor: 'yama',
    },
    meaning: { gloss_ja: 'たかく もりあがった ところ', category: 'nature' },
    encounter: { art: null, template: 'motif:yama', copy_ja: 'やまに のぼるよ。' },
    surfaces: [
      { id: 'yama_1', word: '山', reading_id: 'yama', audio: 'audio/surfaces/yama.mp3' },
      { id: 'fuji_1', word: 'ふじ山', reading_id: 'yama', audio: 'audio/surfaces/fujiyama.mp3' },
    ],
    shape: { kind: 'primitive', published: true, strokes: [{ order: 1, type: 'tate', a11y_ja: 'たての ぼう' }] },
    items: [
      {
        id: '山-r-1',
        type: 'reading_choice',
        lamp: 'reading',
        reading_id: 'yama',
        choices: [
          { kana: 'やま', correct: true },
          { kana: 'かわ', correct: false },
        ],
      },
    ],
    status: 'published',
  };
}

describe('teachReady — D21', () => {
  it('is ready when reading audio exists, even though no surface has audio', () => {
    const char = authoredCharacterSchema.parse(baseRecord());
    // Only the reading file exists — neither surface's audio does.
    const audioExists = (f: string) => f === 'audio/readings/yama.mp3';
    const result = teachReady(char, audioExists);
    expect(result.ready).toBe(true);
    expect(result.unmet).toEqual([]);
  });

  it('is NOT ready when a taught reading is missing its audio', () => {
    const char = authoredCharacterSchema.parse(baseRecord());
    const audioExists = () => false;
    const result = teachReady(char, audioExists);
    expect(result.ready).toBe(false);
    const audioUnmet = result.unmet.find((u) => u.item === 'audio');
    expect(audioUnmet?.satisfied_by).toEqual(['audio/readings/yama.mp3']);
  });

  it('still requires echo capability (a second surface) regardless of audio', () => {
    const record = baseRecord() as { surfaces: unknown[] };
    record.surfaces = [{ id: 'yama_1', word: '山', reading_id: 'yama', audio: 'audio/surfaces/yama.mp3' }];
    const char = authoredCharacterSchema.parse(record);
    const audioExists = (f: string) => f === 'audio/readings/yama.mp3';
    const result = teachReady(char, audioExists);
    expect(result.ready).toBe(false);
    expect(result.unmet.some((u) => u.item === 'echo_capability')).toBe(true);
  });

  it('is ready with every reading audio file present and no surface audio at all', () => {
    const char = authoredCharacterSchema.parse(baseRecord());
    const audioExists = (f: string) => f.startsWith('audio/readings/');
    const result = teachReady(char, audioExists);
    expect(result.ready).toBe(true);
  });
});
