import type { StageCard } from "@/lib/pick-departure";
import { useI18n } from "@/lib/i18n/i18n";

/**
 * child-home-and-sessions.md §1 — the ticket is the child home's ONE
 * control. A real `<button>`, not a decorated `div`: it is the primary
 * control of the entire child experience. The whole card is the tap
 * target, not just a cta line inside it.
 *
 * `cards` is `boardStageCards`'s own output — the same data the ride
 * itself is built from — so the ticket can never promise a station the
 * ride then doesn't offer.
 *
 * Empty state never offers a ride: "never a blank card, and never an
 * invented task" (§1). `pick-departure.ts`'s `pickDeparture` still
 * returns a free-ride kanji even when nothing is due (a different
 * caller's contract); this component ignores it and disables instead.
 */
export function DepartureTicket({
  cards,
  echoDue,
  empty,
  nextArrival,
  onBoard,
}: {
  cards: StageCard[];
  echoDue: boolean;
  empty: boolean;
  nextArrival?: string;
  onBoard: () => void;
}) {
  const { t } = useI18n();

  if (empty) {
    return (
      <button
        type="button"
        disabled
        data-ticket
        data-ticket-empty
        aria-label={t("restDay")}
        className="mx-auto flex min-h-16 w-full max-w-md flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-10 text-center landscape:max-w-sm"
      >
        <p className="font-display text-xl">{t("restDay")}</p>
        {nextArrival ? <p className="text-xs text-fg-subtle">{nextArrival}</p> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onBoard}
      data-ticket
      aria-label={`${t("depart")} ${t("ticketStationCount", { n: cards.length })}`}
      className="mx-auto flex min-h-16 w-full max-w-md flex-col gap-4 rounded-xl border-2 border-primary bg-surface px-6 py-5 text-left landscape:max-w-sm"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg">{t("boardTitle")}</span>
        <span className="text-sm text-fg-muted">{t("ticketStationCount", { n: cards.length })}</span>
      </div>
      <ul className="flex flex-wrap gap-2" aria-hidden>
        {cards.slice(0, 5).map((c) => (
          <li
            key={c.kanji}
            className="grid size-11 place-items-center rounded-md bg-bg-warm font-display text-xl"
          >
            {c.kanji}
          </li>
        ))}
      </ul>
      {echoDue ? <span className="text-xs text-engine">{t("echoDue")}</span> : null}
      <span className="inline-flex h-16 w-full items-center justify-center rounded-lg bg-primary font-display text-2xl tracking-wide text-primary-fg">
        ▶ {t("depart")}
      </span>
    </button>
  );
}
