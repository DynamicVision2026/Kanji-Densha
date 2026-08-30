import { useI18n } from "@/lib/i18n/i18n";
import type { Grade } from "@/data/kyoiku";

/**
 * child-home-and-sessions.md §4 — "with more than one profile, a station
 * board shows one card per child (nickname + their train), tap to enter."
 * The parent authenticates once per device; this is not a second
 * authentication step, just picking which child is holding it right now
 * — so no password/PIN reaches a child, per §4's own rule.
 */
export function StationBoard({
  children,
  onSelect,
}: {
  children: { id: string; name: string; grade: Grade; perfectCount: number }[];
  onSelect: (childId: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-10">
      <h1 className="font-display text-2xl">{t("stationBoardTitle")}</h1>
      <div className="flex w-full flex-col gap-3">
        {children.map((child) => (
          <button
            key={child.id}
            type="button"
            data-station-card={child.id}
            onClick={() => onSelect(child.id)}
            className="flex min-h-16 w-full items-center gap-4 rounded-xl border-2 border-border bg-surface px-5 py-4 text-left"
          >
            <span className="font-display text-lg">{child.name}</span>
            <span className="text-sm text-fg-muted">{t("gradeLabel", { n: child.grade })}</span>
            <span className="ml-auto text-sm text-fg-muted">
              {t("hubGreen")} {child.perfectCount}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
