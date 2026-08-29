import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChildShell } from "@/components/child-shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { readHasRidden } from "@/lib/has-ridden";
import { EntranceDoor } from "@/components/entrance-door";
import { GuestHome } from "@/components/guest-home";

// entrance-page.md §1: one URL, two renders, decided by state. "/" re-renders
// rather than redirecting for the guest cases — a bookmark or home-screen
// icon at the root must keep working — so ssr is off here the same way it
// is on /demo (the render depends on localStorage, which doesn't exist on
// the server, and there's no meaningful page to server-render for a guest
// anyway).
export const Route = createFileRoute("/")({ component: Home, ssr: false });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [ridden, setRidden] = useState<boolean | null>(null);
  useEffect(() => setRidden(readHasRidden()), []);

  if (isPending || ridden === null) {
    return (
      <ChildShell>
        <div className="grid flex-1 place-items-center text-sm text-fg-muted">漢字でんしゃ</div>
      </ChildShell>
    );
  }
  if (user && !user.isDevFallback) return <Navigate to="/app" />;
  if (!ridden) return <EntranceDoor />;
  return <GuestHome />;
}
