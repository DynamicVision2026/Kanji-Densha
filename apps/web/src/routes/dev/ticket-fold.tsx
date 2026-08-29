import { createFileRoute } from "@tanstack/react-router";
import { MasteryLights } from "@/components/mastery-lights";
import { TicketFold } from "@/components/ticket-fold";
import type { MasteryStatus } from "@/lib/mastery";

// practice-card-states.md §5 / return-ticket.md — a review gallery for the
// 到着 fold transformation, not a product page (URL-only, linked from
// nowhere). Mirrors /dev/practice-card-states's convention: every state
// reachable, real text, a caption saying what decision it represents.
const RIDES: { status: MasteryStatus; body: string; caption: string }[] = [
  {
    status: "almost",
    body: "この字は、だいたい残った。つぎに乗るとき、残響で確かめる。",
    caption: "だいたい — pale green, inherited exactly from practice-card-states.md's table.",
  },
  {
    status: "fix",
    body: "もういちど、景色から戻そう。",
    caption: "なおし — amber, same inheritance rule.",
  },
  {
    status: "lost",
    body: "まよっている。ゆっくり、掛け軸から。",
    caption: "まよい — warm grey, gentlest of the set.",
  },
  {
    status: "perfect",
    // The real integration (kanji-session.tsx) computes this against the
    // clamped status too, never かんぺき's own wording — a clamped colour
    // paired with かんぺき's text would just move the same lie from
    // colour to text.
    body: "この字は、だいたい残った。つぎに乗るとき、残響で確かめる。",
    caption:
      "Session-reported perfect (structurally impossible, MR-7.3/I7) — TicketFold clamps both " +
      "colour and text to だいたい rather than trusting the caller. The real かんぺき券 is a " +
      "separate, deferred system (return-ticket.md) issued only on day eight.",
  },
];

export const Route = createFileRoute("/dev/ticket-fold")({
  component: TicketFoldGallery,
});

function TicketFoldGallery() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl">到着 — ticket fold</h1>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">
        docs/design/practice-card-states.md §5, docs/design/return-ticket.md. Review only — not
        linked from product navigation. Each card folds into its ticket shortly after mount.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        {RIDES.map((ride) => (
          <div key={ride.status} className="flex flex-col gap-2">
            <TicketFold
              char="森"
              status={ride.status}
              body={ride.body}
              now={new Date().toISOString()}
              front={
                <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center">
                  <h2 className="font-display text-7xl leading-none">森</h2>
                  <MasteryLights
                    lights={{
                      reading: ride.status !== "new" && ride.status !== "lost",
                      meaning: ride.status !== "new" && ride.status !== "lost",
                      shape: ride.status === "almost" || ride.status === "perfect",
                    }}
                  />
                  <p className="text-sm leading-7 text-fg-muted">{ride.body}</p>
                </section>
              }
            />
            <p className="text-xs leading-5 text-fg-subtle">{ride.caption}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
