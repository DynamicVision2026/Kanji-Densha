// return-ticket.md — "one per session, not per character... characters
// ridden today, up to five." No calendar-day grouping exists anywhere in
// this codebase for UI purposes (sawSavePromptThisSession, couple-pending,
// etc. are all sessionStorage-scoped to the browser tab); this uses the
// same scoping rather than inventing a new one, so "session" here means
// "this open tab," not literally "today."
const KEY = "densha.session-stub.rides.v1";
const MAX_RIDES = 5;

export type SessionRide = {
  char: string;
  echoDueAt: string | null;
};

export function recordSessionRide(ride: SessionRide) {
  if (typeof window === "undefined") return;
  try {
    const rides = readSessionRides().filter((r) => r.char !== ride.char);
    rides.push(ride);
    window.sessionStorage.setItem(KEY, JSON.stringify(rides.slice(-MAX_RIDES)));
  } catch {
    /* ignore */
  }
}

export function readSessionRides(): SessionRide[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is SessionRide =>
        typeof r === "object" && r !== null && typeof (r as SessionRide).char === "string",
    );
  } catch {
    return [];
  }
}

/** The return-ticket.md field: "the earliest almostAt + echoFirstDelayHours
 * in the session" — here, the earliest non-null echoDueAt among this
 * session's rides. Null when nothing in the session has an echo scheduled
 * yet. */
export function earliestEchoDueAt(rides: SessionRide[]): string | null {
  const due = rides.map((r) => r.echoDueAt).filter((d): d is string => d !== null);
  if (!due.length) return null;
  return due.reduce((earliest, d) => (d < earliest ? d : earliest));
}
