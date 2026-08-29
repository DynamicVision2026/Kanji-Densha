import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GuestHome } from "@/components/guest-home";
import { DEMO_CHILD } from "@/lib/demo-progress";
import { resolveActiveGrade } from "@/lib/active-grade";
import { gradeSearchFrom } from "@/lib/grade-nav";

export const Route = createFileRoute("/demo/")({
  component: DemoHome,
  ssr: false,
  validateSearch: gradeSearchFrom,
});

function DemoHome() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const viewGrade = resolveActiveGrade({
    urlGrade: search.grade,
    profileGrade: DEMO_CHILD.grade,
  });
  useEffect(() => {
    if (search.grade == null) {
      void navigate({ to: "/demo", search: { grade: viewGrade }, replace: true });
    }
  }, [search.grade, viewGrade, navigate]);

  return <GuestHome urlGrade={search.grade} />;
}
