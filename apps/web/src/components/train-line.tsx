import { STATUS_META } from "@/lib/mastery";
import type { TrainCar } from "@/lib/train-car";
import { cn } from "@/lib/utils";

// work-order-child-home.md Task 2 / practice-card-states.md's almost-state
// tokens — deliberately NOT STATUS_META.almost's (different, blue-based)
// colour. Solid border, dark ink: dashes mean "not yet real" product-wide,
// and a だいたい car waiting on the siding is real, just waiting — only the
// SIDING'S OWN TRACK is dashed, never the car sitting on it.
const SIDING_TONE = { fill: "#E6F0DC", border: "#9AAE85", ink: "#16301F" };

/**
 * child-home-and-sessions.md §1/§3 — "the train: what the child owns."
 * Read only, per Task 1 ("nothing else tappable except a small 保護者
 * control"): no `Link`, no tap handler, no map trigger.
 *
 * Two tracks: かんぺき cars on the main line (`onMainLine`, D20's
 * stampedAt !== null rule — never current status, so a regressed
 * character keeps its car), だいたい cars waiting on the siding below it.
 * Anything short of だいたい that has never been stamped is on neither
 * track — it isn't "owned" yet, only listed in the ticket's stations.
 *
 * `glow` (from the existing post-couple `writeOverviewIntent` mechanism,
 * already used by WelcomeOverview) briefly highlights a car that just
 * coupled onto the main line — the "visibly, not as a re-render" cue for
 * the return-date coupling, without inventing a new cross-track animation
 * on top of the couple-beat screen that already shows the moment itself.
 */
export function TrainLine({ cars, glow = [] }: { cars: TrainCar[]; glow?: string[] }) {
  const mainLine = cars.filter((c) => c.onMainLine);
  const siding = cars.filter((c) => !c.onMainLine && c.status === "almost");

  if (!mainLine.length && !siding.length) return null;

  return (
    <div data-train-line className="flex flex-col gap-2">
      {mainLine.length ? (
        <div
          role="list"
          aria-label={STATUS_META.perfect.ja}
          data-main-line
          className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-1 py-1"
        >
          {mainLine.map((car) => (
            <span
              key={car.char}
              role="listitem"
              data-line-car={car.char}
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-md font-display text-xl leading-none",
                STATUS_META[car.status].className,
                glow.includes(car.char) && "ring-4 ring-engine",
              )}
            >
              {car.char}
            </span>
          ))}
        </div>
      ) : null}
      {siding.length ? (
        <div
          role="list"
          aria-label={STATUS_META.almost.ja}
          data-siding
          className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-t-2 border-dashed border-border-strong px-1 py-2"
        >
          {siding.map((car) => (
            <span
              key={car.char}
              role="listitem"
              data-siding-car={car.char}
              className="relative grid size-11 shrink-0 place-items-center rounded-md border-2 font-display text-xl leading-none"
              style={{
                backgroundColor: SIDING_TONE.fill,
                borderColor: SIDING_TONE.border,
                color: SIDING_TONE.ink,
              }}
            >
              {car.char}
              {car.echoDue ? (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-engine" aria-hidden />
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
