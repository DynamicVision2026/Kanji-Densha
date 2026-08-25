// ためす (Practice). Thin published items for よみ/いみ/かたち (spec §6).
// One item at a time; a correct answer advances, a wrong answer stays on the
// item — never a red error state before the child has made any input
// (CLAUDE.md §6), and a wrong tap here is gentle, not a scolding X.
//
// The かたち step is a deliberate placeholder, not M4's shape system — see
// docs/open-questions.md Q15. It cannot be answered wrong: it exists so the
// shape lamp can light for real (山 has shape.published: true, so requiredLamps
// includes shape), not to evaluate stroke order, which M4 owns.
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CharacterProgress, ProgressEvent, Lamp } from '@kanji-densha/engine';
import type { CharacterBundle, Item } from '../published/types.js';

interface PracticeProps {
  char: CharacterBundle;
  sessionId: string;
  onAnswer: (event: ProgressEvent) => Promise<CharacterProgress>;
  onComplete: () => void;
}

function makeAnswerEvent(itemId: string, lamp: Lamp, correct: boolean, sessionId: string): ProgressEvent {
  return {
    type: 'answer',
    at: Date.now(),
    sessionId,
    itemId,
    lamp,
    correct,
    mode: 'practice',
    surfaceId: null,
    soft: false,
  };
}

// COPY-REVIEW: 「おしい」は仮の日本語（ネイティブ確認前）。
function GentleRetryHint() {
  return <p style={{ fontSize: 16, color: 'var(--ink-soft)', margin: 0 }}>おしい！もういちど。</p>;
}

const choiceButtonStyle: CSSProperties = {
  minHeight: 44,
  minWidth: 44,
  fontSize: 20,
  padding: '10px 20px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--paper)',
  color: 'var(--ink)',
};

function ReadingItem({
  item,
  onPick,
  showRetry,
}: {
  item: Extract<Item, { type: 'reading_choice' }>;
  onPick: (correct: boolean) => void;
  showRetry: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <p style={{ fontSize: 18, margin: 0 }}>どう よむ？</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {item.choices.map((c: { kana: string; correct: boolean }, i: number) => (
          <button key={i} type="button" style={choiceButtonStyle} onClick={() => onPick(c.correct)}>
            {c.kana}
          </button>
        ))}
      </div>
      {showRetry && <GentleRetryHint />}
    </div>
  );
}

function MeaningItem({
  item,
  onPick,
  showRetry,
}: {
  item: Extract<Item, { type: 'meaning_choice' }>;
  onPick: (correct: boolean) => void;
  showRetry: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <p style={{ fontSize: 18, margin: 0 }}>どういう いみ？</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {item.choices.map((c: { gloss_ja: string; correct: boolean }, i: number) => (
          <button key={i} type="button" style={choiceButtonStyle} onClick={() => onPick(c.correct)}>
            {c.gloss_ja}
          </button>
        ))}
      </div>
      {showRetry && <GentleRetryHint />}
    </div>
  );
}

// COPY-REVIEW: 仮の日本語（ネイティブ確認前）。
function ShapePlaceholder({ char, onDone }: { char: CharacterBundle; onDone: () => void }) {
  const strokeCount = char.shape.published && char.shape.kind === 'primitive' ? char.shape.strokes.length : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <p style={{ fontSize: 18, margin: 0 }}>かきかたを みてみよう。</p>
      <div style={{ fontFamily: 'var(--font-hero)', fontSize: 72, color: 'var(--ink)' }}>{char.character}</div>
      {strokeCount !== null && (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{strokeCount}かく</p>
      )}
      <button type="button" style={{ ...choiceButtonStyle, background: 'var(--vermilion)', color: 'white', border: 'none' }} onClick={onDone}>
        できた！
      </button>
    </div>
  );
}

export function Practice({ char, sessionId, onAnswer, onComplete }: PracticeProps) {
  const [index, setIndex] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  const items = char.items;
  const item = items[index];

  if (item === undefined) {
    onComplete();
    return null;
  }

  const advance = () => {
    setShowRetry(false);
    if (index + 1 >= items.length) onComplete();
    else setIndex(index + 1);
  };

  const handlePick = (lamp: Lamp) => (correct: boolean) => {
    void onAnswer(makeAnswerEvent(item.id, lamp, correct, sessionId)).then(() => {
      if (correct) advance();
      else setShowRetry(true);
    });
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
      {item.type === 'reading_choice' && <ReadingItem item={item} onPick={handlePick('reading')} showRetry={showRetry} />}
      {item.type === 'meaning_choice' && <MeaningItem item={item} onPick={handlePick('meaning')} showRetry={showRetry} />}
      {item.type === 'stroke_order' && (
        <ShapePlaceholder
          char={char}
          onDone={() => {
            void onAnswer(makeAnswerEvent(item.id, 'shape', true, sessionId)).then(advance);
          }}
        />
      )}
    </section>
  );
}
