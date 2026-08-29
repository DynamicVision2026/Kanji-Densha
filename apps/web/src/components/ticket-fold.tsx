import { useEffect, useState, type ReactNode } from "react";
import type { MasteryStatus } from "@/lib/mastery";
import { CARD_TONE } from "@/components/practice-card";

// practice-card-states.md §5 / return-ticket.md — "the card folds into a
// ticket in front of the child" at 到着. MR-7.3/I7: a session can never
// grant かんぺき, so the engine should never hand this component
// `status: "perfect"` outside the separate couple-beat path — but this is
// exactly the seam where showing it would be the product lying to a child
// (practice-card-states.md §1), so the ticket clamps to だいたい
// defensively rather than trusting the caller.
const SESSION_CEILING: MasteryStatus = "almost";
const FOLD_MS = 260;

/** Same derivation as practice-card.tsx's serial: same character, same
 * status, same object, same number — whether it's mid-ride on the card or
 * folded into a ticket at 到着. */
function serialFor(char: string, status: MasteryStatus): string {
  let hash = 0;
  for (const c of `${char}:${status}`) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return `No.${String(hash % 100000).padStart(5, "0")}`;
}

function issueDate(nowIso: string): string {
  return new Date(nowIso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * QR is a real requirement here, but a real scannable payload needs either
 * a QR-encoding dependency or a hand-rolled encoder — a bigger decision
 * than this component should make silently, and a QR that *looks* real but
 * doesn't scan is worse than no QR. This renders a correctly sized,
 * correctly positioned placeholder so the footer's layout and text-sizing
 * math are right; it does not encode a resume URL yet. Flagged in the PR.
 */
function QrPlaceholder({ seed }: { seed: string }) {
  let hash = 0;
  for (const c of seed) hash = (hash * 33 + c.charCodeAt(0)) >>> 0;
  const bits = Array.from({ length: 81 }, () => {
    hash = (hash * 1103515245 + 12345) >>> 0;
    return hash % 2 === 0;
  });
  return (
    <svg width={22} height={22} viewBox="0 0 9 9" aria-hidden data-qr-placeholder className="shrink-0">
      <rect width={9} height={9} fill="#fff" />
      {bits.map((on, i) => (on ? <rect key={i} x={i % 9} y={Math.floor(i / 9)} width={1} height={1} /> : null))}
    </svg>
  );
}

/**
 * Wraps the existing feedback-beat content (`front`) and, shortly after
 * mount, folds it into a ticket: same character, the state colour inherited
 * exactly via `CARD_TONE`, dated, punched (reusing item 1's `.ticket-notch`
 * mask). A single panel rotates edge-on (rotateX to 90°, where perspective
 * collapses it to a sliver — the actual "fold"), swaps its rendered content
 * at that invisible instant, then rotates back to flat. Because only one
 * face is ever in the DOM, the box re-flows to whatever height the new
 * content needs with no measurement or hardcoded heights required, and
 * reduced-motion users get the swap without the animation.
 */
export function TicketFold({
  front,
  char,
  status,
  body,
  now,
}: {
  front: ReactNode;
  char: string;
  status: MasteryStatus;
  body: string;
  /** ISO timestamp, matching the rest of the session's clock (`now` from kanji-session.tsx). */
  now: string;
}) {
  const ticketStatus = status === "perfect" ? SESSION_CEILING : status;
  const tone = CARD_TONE[ticketStatus];
  const [revealed, setRevealed] = useState(false);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    setRevealed(false);
    setAngle(0);
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const foldMs = reduceMotion ? 0 : FOLD_MS;
    const timers = [
      setTimeout(() => setAngle(90), 20),
      setTimeout(() => {
        setRevealed(true);
        setAngle(-90);
      }, 20 + foldMs),
      setTimeout(() => setAngle(0), 40 + foldMs),
    ];
    return () => timers.forEach(clearTimeout);
  }, [char, ticketStatus]);

  return (
    <div className="mx-auto w-full max-w-sm" style={{ perspective: 900 }} data-ticket-fold data-status={ticketStatus}>
      <div
        className="ticket-fold-panel"
        style={{ transform: `rotateX(${angle}deg)`, transitionDuration: `${FOLD_MS}ms` }}
      >
        {revealed ? (
          <div
            className="ticket-notch ticket-paper flex flex-col items-center gap-2 rounded-xl p-4 text-center"
            style={{ backgroundColor: tone.fill, border: `2px solid ${tone.border}`, color: tone.ink }}
            data-ticket
          >
            <p className="font-display text-[34px] leading-none">{char}</p>
            <p className="ticket-fold-body text-sm leading-6">{body}</p>
            <div className="ticket-fold-footer w-full font-mono text-[10px] whitespace-nowrap">
              <span>{serialFor(char, ticketStatus)}</span>
              <QrPlaceholder seed={`${char}:${ticketStatus}`} />
              <span>{issueDate(now)}</span>
            </div>
          </div>
        ) : (
          front
        )}
      </div>
    </div>
  );
}
