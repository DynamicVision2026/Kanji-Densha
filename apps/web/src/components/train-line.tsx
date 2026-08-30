import { STATUS_META } from "@/lib/mastery";
import type { StripCar } from "@/lib/pick-departure";
import { cn } from "@/lib/utils";

/**
 * child-home-and-sessions.md §1 — "the train: what the child owns." Read
 * only: the ticket is the child home's one and only control (work order
 * Task 1), so this renders cars with no `Link`, no tap handler, no map
 * trigger. Task 2 splits this into a main line (stampedAt !== null) and a
 * siding (だいたい, waiting); Task 1 keeps every car on one line as a
 * deliberately minimal first step.
 */
export function TrainLine({ cars, currentChar }: { cars: StripCar[]; currentChar?: string }) {
  return (
    <div
      data-train-line
      role="list"
      className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-1 py-1"
    >
      {cars.map((car) => {
        const meta = STATUS_META[car.status];
        return (
          <span
            key={car.char}
            role="listitem"
            data-line-car={car.char}
            className={cn(
              "relative grid size-11 shrink-0 place-items-center rounded-md font-display text-xl leading-none",
              meta.className,
              car.char === currentChar && "ring-2 ring-fg",
            )}
          >
            {car.char}
            {car.echoDue ? (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-engine" aria-hidden />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
