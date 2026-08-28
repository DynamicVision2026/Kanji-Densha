// わかる (Understand). Elementary 音・訓 only (already guaranteed by the gate —
// taught_readings can only be elementary readings, I4), short meaning, speaker
// buttons (I10). Not scored (MR-3.2: understand sets understood=true, clears
// lostFlag — nothing else).
//
// `reteach` is Q16's recovery path: a counted wrong during ためす clears
// understood (MR-4.6) with no way back in the original M3 slice — a
// six-year-old's median session then dead-ends before 到着. Practice.tsx
// re-shows this same screen with the framing on, the child taps through, and
// ためす resumes at the item they were on — the train backing up one station,
// not a restart and not an error state.
import type { CharacterBundle, TaughtReading, Surface } from '../published/types.js';
import { Speaker } from './Speaker.js';

// COPY-REVIEW: ボタン文言・もどり文言は仮（ネイティブ確認前）。
export function Understand({
  char,
  reteach = false,
  onContinue,
}: {
  char: CharacterBundle;
  reteach?: boolean;
  onContinue: () => void;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
      {reteach && (
        <p style={{ fontSize: 18, textAlign: 'center', margin: 0, color: 'var(--ink)' }}>もういちど みてみよう</p>
      )}
      <div style={{ fontFamily: 'var(--font-hero)', fontSize: 56, textAlign: 'center', color: 'var(--ink)' }}>
        {char.character}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {char.taught_readings.entries.map((r: TaughtReading) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22 }}>
            <Speaker file={r.audio} label={`${r.kana} を きく`} />
            <span>{r.kana}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 18, color: 'var(--ink-soft)', margin: 0 }}>{char.meaning.gloss_ja}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {char.surfaces.map((s: Surface) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20 }}>
            <Speaker file={s.audio} label={`${s.word} を きく`} />
            <span>{s.word}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        style={{
          minHeight: 44,
          fontSize: 18,
          padding: '12px 24px',
          borderRadius: 999,
          background: 'var(--vermilion)',
          color: 'white',
          border: 'none',
        }}
      >
        わかった！
      </button>
    </section>
  );
}
