// 出会う (Encounter). Large character + illustration + short copy. Continues
// with an explicit action (乗った). Not scored (MR-3.1: encounter sets
// encountered=true, nothing else) — fired when the child taps the continue
// button, not on mount, so the event and the child's acknowledgement are the
// same action.
import type { CharacterBundle } from '../published/types.js';

// No encounter-art assets exist in this environment (D16-adjacent: content
// art, like audio, is produced outside code and was never supplied). This is
// an honest CSS placeholder for the ink-wash illustration, not real art —
// swap for the actual template/asset system when art lands.
// COPY-REVIEW: つづきの ボタン文言は仮の日本語（ネイティブ確認前）。
function InkPlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: 160,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #e8e0cf 0%, #d8cfbe 60%, #c9bfa8 100%)',
        border: '1px solid var(--line)',
      }}
    />
  );
}

export function Encounter({ char, onContinue }: { char: CharacterBundle; onContinue: () => void }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <InkPlaceholder />
      <div
        style={{ fontFamily: 'var(--font-hero)', fontSize: 96, textAlign: 'center', lineHeight: 1, color: 'var(--ink)' }}
      >
        {char.character}
      </div>
      <p style={{ fontSize: 20, textAlign: 'center', color: 'var(--ink-soft)', margin: 0 }}>{char.encounter.copy_ja}</p>
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
        のった！
      </button>
    </section>
  );
}
