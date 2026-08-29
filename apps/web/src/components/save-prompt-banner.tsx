import { Link } from "@tanstack/react-router";

// entrance-page.md §6 — copy verbatim, Japanese only this release. Trigger,
// placement (above つぎへ, not a modal or replacement), and decline cost
// ("no paywall, no hard gate, no degraded ride") are the caller's job; this
// component only renders the banner once told to.
export function SavePromptBanner({ onDecline }: { onDecline: () => void }) {
  return (
    <div
      className="mb-2 rounded-xl border border-border bg-surface p-4"
      data-save-prompt
    >
      <p className="font-display text-base">つづきを ほぞんしますか</p>
      <p className="mt-1 text-sm leading-6 text-fg-muted">
        この でんしゃは、2〜3日あとに もういちど もどってきます。ほぞんしておくと、そのとき
        つづきから のれます。
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/onboard"
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm text-primary-fg"
        >
          ほぞんする
        </Link>
        <button
          type="button"
          onClick={onDecline}
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-bg text-sm text-fg-muted"
        >
          あとで
        </button>
      </div>
    </div>
  );
}
