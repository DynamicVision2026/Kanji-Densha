import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAutoDemo } from "@/components/auto-demo";
import { ChildShell } from "@/components/child-shell";
import { DepartureTicket } from "@/components/departure-ticket";
import { ParentDoor } from "@/components/parent-door";
import { TrainLine } from "@/components/train-line";
import { WelcomeOverview } from "@/components/welcome-overview";
import type { DepartureBoard } from "@/lib/departure-board";
import { boardStageCards, pickDeparture, type StripCar } from "@/lib/pick-departure";
import {
  clearOverviewGlow,
  clearOverviewOpen,
  readOverviewIntent,
  type GradeRingView,
} from "@/lib/train-overview";
import { useI18n } from "@/lib/i18n/i18n";
import type { Grade } from "@/data/kyoiku";

// child-home-and-sessions.md §1 — "the child home has exactly one control:
// the ticket." HubPlate and the map overlay were both tap-triggers with no
// other purpose; neither is named in the design doc's element list (the
// train, then the ticket), and removing their tap paths — required by
// "nothing else tappable" — leaves them unreachable from here. Their
// component files are untouched in case a parent-surface use turns up, but
// this screen no longer mounts them. Flagged in the PR, not silently
// dropped: there is currently no way for a child to open the map or the
// full-train overview by their own tap, only via the post-couple
// `writeOverviewIntent` path below, which is unaffected (it is driven by
// navigation + an effect, not by a control on this screen).
export function ChildHome({
  hrefBase,
  childId,
  grade,
  profileGrade,
  cars,
  board,
  echoQueue,
  rings,
}: {
  hrefBase: "/demo" | "/app";
  childId?: string;
  grade: Grade;
  profileGrade: Grade;
  cars: StripCar[];
  board: DepartureBoard | null | undefined;
  echoQueue: { kanji: string }[];
  rings: GradeRingView[];
}) {
  const { t } = useI18n();
  const tour = useAutoDemo();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(false);
  const [focusGrade, setFocusGrade] = useState<Grade>(grade);
  const [focusChar, setFocusChar] = useState<string | undefined>();
  const [glow, setGlow] = useState<string[]>([]);
  const cards = useMemo(
    () => boardStageCards({ board, echoQueue, cars }),
    [board, echoQueue, cars],
  );
  const depart = useMemo(
    () => pickDeparture({ board, echoQueue, cars }),
    [board, echoQueue, cars],
  );
  const rideTo = hrefBase === "/demo" ? "/demo/kanji/$char" : "/app/kanji/$char";
  const parentTo = hrefBase === "/demo" ? "/demo/parent" : "/app/parent";
  const search = {
    ...(childId ? { child: childId } : {}),
    grade,
  };

  useEffect(() => {
    const intent = readOverviewIntent();
    if (!intent) return;
    if (intent.open) {
      setOverview(true);
      if (intent.focusChar) setFocusChar(intent.focusChar);
      clearOverviewOpen();
    }
    if (intent.glow?.length) {
      setGlow(intent.glow);
      window.setTimeout(() => {
        setGlow([]);
        setFocusChar(undefined);
        clearOverviewGlow();
      }, 1200);
    }
  }, []);

  const nextArrival =
    !depart.empty || !board?.tomorrow[0]
      ? undefined
      : t("echoArrival", {
          when:
            board.tomorrow[0].when === "dayAfter"
              ? t("echoArrivalDayAfter")
              : t("echoArrivalTomorrow"),
        });

  return (
    <ChildShell>
      {tour.active ? (
        <p className="shrink-0 bg-bg-warm px-4 py-1 text-center text-[11px] text-fg-muted">
          {t("tourLiveBanner")}
        </p>
      ) : null}

      {overview ? (
        <WelcomeOverview
          rings={rings}
          profileGrade={profileGrade}
          focusGrade={focusGrade}
          focusChar={focusChar}
          glow={glow}
          hrefBase={hrefBase}
          onBack={() => {
            setOverview(false);
            setFocusChar(undefined);
          }}
          onFocusGrade={(g) => {
            setFocusGrade(g);
            setFocusChar(undefined);
          }}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <header
            data-child-top
            className="flex h-11 shrink-0 items-center justify-end gap-2 px-3 pt-[env(safe-area-inset-top)]"
          >
            {/* entrance-page.md §1: a labelled, visible parent control — not
                hold-only, which a first-time parent will never discover.
                ParentDoor's 1.5s hold stays as an additional path
                (work order Task 3). This is the one control besides the
                ticket that §1 permits. */}
            <Link
              to={parentTo}
              className="inline-flex h-11 shrink-0 items-center rounded-md border border-border bg-surface/90 px-3 text-xs text-fg-muted"
              data-parent-link
            >
              {t("parentLinkLabel")}
            </Link>
            <ParentDoor to={parentTo} />
          </header>

          <div data-child-train className="shrink-0 px-3">
            <TrainLine cars={cars} currentChar={depart.empty ? undefined : depart.kanji} />
          </div>

          <section
            data-child-stage
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-3"
          >
            <DepartureTicket
              cards={cards}
              echoDue={cards.some((c) => c.echoDue)}
              empty={depart.empty}
              nextArrival={nextArrival}
              onBoard={() => {
                void navigate({ to: rideTo, params: { char: depart.kanji }, search });
              }}
            />
          </section>
        </div>
      )}
    </ChildShell>
  );
}
