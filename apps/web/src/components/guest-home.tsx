import { ChildHome } from "@/components/child-home";
import { DEMO_CHILD, getDemoHome, getDemoMap } from "@/lib/demo-progress";
import { resolveActiveGrade, usePersistActiveGrade } from "@/lib/active-grade";
import { toTrainCar } from "@/lib/train-car";
import type { Grade } from "@/data/kyoiku";

/**
 * The guest child home — shared by `/demo` and, once `hasRidden` is set,
 * `/` itself (entrance-page.md §1: "/" re-renders rather than redirecting,
 * so a bookmark or home-screen icon at the root keeps working). One
 * implementation, two routes, so they cannot drift apart.
 */
export function GuestHome({ urlGrade }: { urlGrade?: Grade }) {
  const viewGrade = resolveActiveGrade({ urlGrade, profileGrade: DEMO_CHILD.grade });
  usePersistActiveGrade(viewGrade);
  const home = getDemoHome(viewGrade);
  const map = getDemoMap(viewGrade);
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
      hrefBase="/demo"
      grade={viewGrade}
      profileGrade={DEMO_CHILD.grade}
      cars={cars}
      trainCars={trainCars}
      board={home.board}
      echoQueue={home.echoQueue}
      lines={map.lines}
      rings={home.rings}
    />
  );
}
