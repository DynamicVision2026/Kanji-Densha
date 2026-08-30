import type { MasteryStatus } from "./mastery";

export type TrainCar = {
  char: string;
  status: MasteryStatus;
  onMainLine: boolean;
  echoDue?: boolean;
};

/**
 * child-home-and-sessions.md §3 / D20 — "a car once attached is never
 * detached." `stampedAt` is write-once (D7), so main-line membership must
 * key off it rather than current `status`: a character that reached
 * かんぺき and then regressed keeps its main-line car. Everything that has
 * reached だいたい but not yet been stamped waits on the siding instead;
 * anything short of だいたい (new, fix, lost with no prior stamp) isn't
 * "owned" yet and appears on neither track — only in the ticket's station
 * list (departure-ticket.tsx).
 */
export function toTrainCar(input: {
  char: string;
  status: MasteryStatus;
  stampedAt: string | null;
  echoDue?: boolean;
}): TrainCar {
  return {
    char: input.char,
    status: input.status,
    onMainLine: input.stampedAt !== null,
    echoDue: input.echoDue,
  };
}
