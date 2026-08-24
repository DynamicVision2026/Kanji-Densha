import { describe, it, expect } from 'vitest';
import { authoredCharacterSchema } from './schema';

// A minimal, valid published record used as the base for rejection cases.
function validRecord(): unknown {
  return {
    character: '山',
    grade: 1,
    taught_readings: [{ id: 'yama', kana: 'やま', type: 'kun', audio: 'audio/山/yama.mp3' }],
    meaning: { gloss_ja: 'たかく もりあがった ところ', category: 'nature' },
    encounter: { art: 'art/山/encounter.webp', template: null, copy_ja: 'やまに のぼるよ。' },
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

describe('authoredCharacterSchema', () => {
  it('parses a valid record and defaults lines to []', () => {
    const r = authoredCharacterSchema.parse(validRecord());
    expect(r.character).toBe('山');
    expect(r.lines).toEqual([]);
  });

  it('I1: a lamp given as an array is unparseable', () => {
    const bad = validRecord() as Record<string, unknown>;
    (bad.items as { lamp: unknown }[])[0]!.lamp = ['reading'];
    expect(authoredCharacterSchema.safeParse(bad).success).toBe(false);
  });

  it('compound shape with a raw stroke list is unparseable; primitive needs strokes', () => {
    const compoundWithStrokes = validRecord() as Record<string, unknown>;
    compoundWithStrokes.shape = { kind: 'compound', published: true, strokes: [{ order: 1, type: 'tate', a11y_ja: 'x' }] };
    expect(authoredCharacterSchema.safeParse(compoundWithStrokes).success).toBe(false);

    const compoundOk = validRecord() as Record<string, unknown>;
    compoundOk.shape = { kind: 'compound', published: true, components: [{ char: '木' }, { char: '木' }] };
    expect(authoredCharacterSchema.safeParse(compoundOk).success).toBe(true);
  });

  it('a meaning distractor carrying a kana reading is a parse error (semantic only)', () => {
    const bad = validRecord() as Record<string, unknown>;
    bad.items = [
      {
        id: '山-m-1',
        type: 'meaning_choice',
        lamp: 'meaning',
        choices: [
          { gloss_ja: 'やま', semantic: true, correct: true },
          { gloss_ja: 'かわ', semantic: true, kana: 'かわ', correct: false }, // stray kana field
        ],
      },
    ];
    expect(authoredCharacterSchema.safeParse(bad).success).toBe(false);
  });

  it('normalises kanji/word strings to NFC at the boundary', () => {
    // Built from code points so the source itself carries no precomposed literal:
    // か (U+304B) + combining dakuten (U+3099) is the decomposed form of が (U+304C).
    const decomposedGa = String.fromCharCode(0x304b, 0x3099);
    const composedGa = String.fromCharCode(0x304c);
    expect(decomposedGa.length).toBe(2);
    expect(decomposedGa).not.toBe(composedGa); // input really is decomposed
    const rec = validRecord() as Record<string, unknown>;
    (rec.surfaces as { word: string }[])[0]!.word = decomposedGa;
    const r = authoredCharacterSchema.parse(rec);
    expect(r.surfaces[0]!.word).toBe(composedGa); // normalised to composed
  });
});
