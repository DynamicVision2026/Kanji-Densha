import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { CatalogPage } from "@/components/catalog-page";
import { StationBoard } from "@/components/station-board";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveChild } from "@/lib/active-child";
import { catalogSearchFrom } from "@/lib/grade-nav";
import { listChildren } from "@/lib/server/children";
import type { Grade } from "@/data/kyoiku";

export const Route = createFileRoute("/app/catalog")({
  component: AppCatalog,
  validateSearch: catalogSearchFrom,
});

function AppCatalog() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const childrenQ = useQuery({ queryKey: ["children"], queryFn: () => listChildren() });
  const { childId, needsPicker, select } = useActiveChild(childrenQ.data, {
    onEmpty: () => void navigate({ to: "/onboard" }),
  });

  const current = useMemo(
    () => childrenQ.data?.find((c) => c.id === childId),
    [childrenQ.data, childId],
  );

  if (needsPicker && childrenQ.data) {
    return (
      <AppShell>
        <StationBoard children={childrenQ.data} onSelect={select} />
      </AppShell>
    );
  }

  if (!current) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <CatalogPage
      hrefBase="/app"
      childName={current.name}
      childGrade={current.grade as Grade}
      viewGrade={search.grade}
      query={search.q ?? ""}
    />
  );
}
