import { createFileRoute } from "@tanstack/react-router";
import { PracticeCard } from "@/components/practice-card";
import type { MasteryStatus, PracticeKind } from "@/lib/mastery";

// practice-card-states.md — a review gallery, not a product page (URL-only,
// linked from nowhere). The five engine statuses, one card each, side by
// side per prototypes/README's "every state reachable... reviewer explores
// rather than imagines." かんぺき is shown here on its own terms (a design
// review of what day eight looks like), which is different from the live
// session ever producing it — the engine cannot derive `perfect` from a
// single sitting (MR-7.3, I7), so the caption says so rather than leaving it
// implied.
const STATES: {
  status: MasteryStatus;
  lamps: Record<PracticeKind, boolean>;
  caption: string;
}[] = [
  {
    status: "new",
    lamps: { reading: false, meaning: false, shape: false },
    caption: "はじめて — 未着手。破線は「まだ本物ではない」の合図（デモ列車と同じ文法）。",
  },
  {
    status: "fix",
    lamps: { reading: true, meaning: true, shape: false },
    caption: "なおし — かたちだけ要修理。読み・意味の灯は消えない：直した分は失わない。",
  },
  {
    status: "lost",
    lamps: { reading: false, meaning: false, shape: false },
    caption: "まよい — 一番やさしいカード。赤なし、しかめ面なし。わかるへ一度戻るだけ。",
  },
  {
    status: "almost",
    lamps: { reading: true, meaning: true, shape: true },
    caption: "だいたい — 三灯そろって到着した直後。かんぺきは、まだ先。",
  },
  {
    status: "perfect",
    lamps: { reading: true, meaning: true, shape: true },
    caption:
      "かんぺき — 8日目、間隔をあけた残響に二度成功した後にだけ現れる。一度のセッションでは絶対に出ない状態。",
  },
];

export const Route = createFileRoute("/dev/practice-card-states")({
  component: PracticeCardStates,
});

function PracticeCardStates() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl">Practice card — states</h1>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">
        docs/design/practice-card-states.md, all five engine statuses. Review only — not linked
        from product navigation.
      </p>
      {/* practice-card-states.md §4 allows "two or three up" past 1024px;
          this review page stays at two — the same count as tablet — rather
          than chase a three-column cascade order fight with the entrance
          page's own use of an arbitrary min-[1025px] breakpoint on the same
          build. Both counts are explicitly within spec. */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {STATES.map((s) => (
          <div key={s.status} className="flex flex-col gap-2">
            <PracticeCard
              char="森"
              status={s.status}
              lamps={s.lamps}
              onPrimaryAction={() => {}}
            />
            <p className="text-xs leading-5 text-fg-subtle">{s.caption}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
