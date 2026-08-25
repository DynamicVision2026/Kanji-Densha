// 到着 (Arrival). Same-session status caps at だいたい even if all required
// lamps are on (MR-7.3/I7) — this screen is what carries that fact to the
// child honestly: だいたい, said plainly and warmly, かんぺき comes later after
// the train comes back. No percentage, no score, no streak, no implication of
// failure. Read-only: this screen fires no event (I8's read-only spirit
// applies here too — arrival observes the status apply() already returned).
import type { CharacterProgress, Status } from '@kanji-densha/engine';

// Five status colours, paired with a shape/label (never colour alone,
// architecture §4 — distinguishable in greyscale and to a colour-blind
// parent). Arrival only ever actually shows almost or perfect (M3 has no
// echo scheduling, so perfect cannot happen in-session either — I7) but the
// map is complete since a returning ride could show any of the five later.
const STATUS_META: Record<Status, { color: string; mark: string; label: string }> = {
  new: { color: 'var(--status-new)', mark: '○', label: 'はじめて' },
  lost: { color: 'var(--status-lost)', mark: '△', label: 'まよい' },
  fix: { color: 'var(--status-fix)', mark: '◇', label: 'なおし' },
  almost: { color: 'var(--status-almost)', mark: '◐', label: 'だいたい' },
  perfect: { color: 'var(--status-perfect)', mark: '●', label: 'かんぺき' },
};

// COPY-REVIEW: 到着メッセージは仮の日本語（ネイティブ確認前）。プロダクトの
// 哲学を運ぶ一番だいじな文なので、必ずネイティブ確認をしてから使うこと。
const ARRIVAL_COPY: Record<Status, string> = {
  new: 'また あそびに きてね。',
  lost: 'つぎは、もういちど やってみよう。だいじょうぶ。',
  fix: 'もうすこしで だいたい だよ。',
  almost: 'だいたい できたね！つぎに でんしゃが もどってきたら、かんぺきに なるよ。',
  perfect: 'かんぺき！すごいね！',
};

export function Arrival({ progress, onRideAgain }: { progress: CharacterProgress; onRideAgain: () => void }) {
  const meta = STATUS_META[progress.status];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, alignItems: 'center' }}>
      <div
        role="img"
        aria-label={meta.label}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: meta.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        {meta.mark}
      </div>
      <p style={{ fontSize: 16, color: 'var(--ink-soft)', margin: 0 }}>{meta.label}</p>
      <p style={{ fontSize: 20, textAlign: 'center', margin: 0, maxWidth: 320 }}>{ARRIVAL_COPY[progress.status]}</p>
      <button
        type="button"
        onClick={onRideAgain}
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
        もういちど のる
      </button>
    </section>
  );
}
