import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ChildHome } from "@/components/child-home";
import { ChildShell } from "@/components/child-shell";
import { StationBoard } from "@/components/station-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveChild } from "@/lib/active-child";
import { resolveActiveGrade, usePersistActiveGrade } from "@/lib/active-grade";
import { gradeSearchFrom } from "@/lib/grade-nav";
import { listChildren } from "@/lib/server/children";
import { getHomeState, getMapState } from "@/lib/server/progress";
import { toTrainCar } from "@/lib/train-car";
import type { Grade } from "@/data/kyoiku";

export const Route = createFileRoute("/app/")({
  component: AppHome,
  validateSearch: gradeSearchFrom,
});

function AppHome() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const childrenQ = useQuery({
    queryKey: ["children"],
    queryFn: () => listChildren(),
  });

  // child-home-and-sessions.md §4 review ruling: the board should show
  // only on first open or when the parent explicitly switches — a
  // single-profile household resolves `childId` here and never sees the
  // board; a multi-profile one that already has a remembered child (see
  // active-child.ts) resolves straight to it too. The board only appears
  // when there is no remembered child, or after /app/parent's "switch
  // child" affordance clears it.
  const { childId, needsPicker, select } = useActiveChild(childrenQ.data, {
    onEmpty: () => void navigate({ to: "/onboard" }),
  });

  const current = useMemo(
    () => childrenQ.data?.find((c) => c.id === childId),
    [childrenQ.data, childId],
  );
  const childGrade = (current?.grade ?? 1) as Grade;
  const viewGrade = resolveActiveGrade({
    urlGrade: search.grade,
    profileGrade: childGrade,
    childId,
  });
  usePersistActiveGrade(viewGrade, childId);
  useEffect(() => {
    if (childId && search.grade == null) {
      void navigate({ to: "/app", search: { grade: viewGrade }, replace: true });
    }
  }, [childId, search.grade, viewGrade, navigate]);

  const homeQ = useQuery({
    queryKey: ["home", childId, viewGrade],
    queryFn: () => getHomeState({ data: { childId: childId!, grade: viewGrade } }),
    enabled: Boolean(childId),
  });
  // Only feeds MapOverlay, which now opens from 到着 (the couple-beat's
  // "see the route" link) rather than a home-screen tap — not urgent
  // enough to block the home's own loading skeleton on.
  const mapQ = useQuery({
    queryKey: ["map", childId, viewGrade],
    queryFn: () => getMapState({ data: { childId: childId!, grade: viewGrade } }),
    enabled: Boolean(childId),
  });
  if (childrenQ.isLoading) {
    return (
      <ChildShell>
        <div className="mx-auto flex w-full max-w-[900px] flex-1 items-center px-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </ChildShell>
    );
  }

  if (needsPicker && childrenQ.data) {
    return (
      <ChildShell>
        <StationBoard children={childrenQ.data} onSelect={select} />
      </ChildShell>
    );
  }

  if ((childId && homeQ.isLoading) || !homeQ.data) {
    return (
      <ChildShell>
        <div className="mx-auto flex w-full max-w-[900px] flex-1 items-center px-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </ChildShell>
    );
  }

  const home = homeQ.data;
  const cars = home.trains.flatMap((t) =>
    t.cars.map((c) => ({ char: c.char, status: c.status, echoDue: c.echoDue })),
  );
  const trainCars = home.trains.flatMap((t) =>
    t.cars.map((c) =>
      toTrainCar({ char: c.char, status: c.status, stampedAt: c.stampedAt ?? null, echoDue: c.echoDue }),
    ),
  );

  return (
    <ChildHome
      hrefBase="/app"
      childId={childId ?? undefined}
      grade={viewGrade}
      profileGrade={childGrade}
      cars={cars}
      trainCars={trainCars}
      board={home.board}
      echoQueue={home.echoQueue}
      lines={mapQ.data?.lines ?? []}
      rings={home.rings ?? []}
    />
  );
}
