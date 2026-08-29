import type { CharacterProgress, EchoAttempt, Status } from "@kanji-densha/engine";
import type { ProgressState } from "@/lib/progress-eval";

// Guest -> account migration. Not specified in any design doc as written —
// build-plan.md's M7 entry defers defining "the guest->account merge rule"
// until echo timestamps exist, and this file is that definition, arrived at
// directly from the architect's brief (per-character: take the higher
// status; on a tie, keep the earlier almostAt so an echo clock already
// ticking is never reset). If a future doc states this rule differently,
// that doc wins — this comment is not a citation, it's a record of where
// the rule actually came from.

const GUEST_IMPORT_SESSION = "guest-import";

function hoursFromIso(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms / 3_600_000;
}

/**
 * The old demo engine only ever stored a bare success count (0/1/2), never
 * individual echo attempts — MR-5's eligibility checks need at least the
 * first attempt's own timestamp to anchor the 48h floor on a second echo.
 * That timestamp was never recorded, so it can't be recovered; anchoring the
 * synthetic attempt to `almostAt` itself is the safe direction to be wrong
 * in, because the true first echo could only have happened at or after
 * `almostAt + echoFirstDelayHours` — strictly later than `almostAt`. Using
 * `almostAt` therefore never makes a migrated child wait *longer* for a
 * second echo than they honestly would have; it can only make the floor a
 * little more permissive than reality, never less.
 */
function reconstructEchoes(state: ProgressState, almostAt: number | null): readonly EchoAttempt[] {
  const count = Math.min(2, state.echoSuccessCount ?? 0);
  if (count <= 0 || almostAt === null) return [];
  return Array.from({ length: count }, (_, i) => ({
    at: almostAt + i,
    ok: true,
    sessionId: `${GUEST_IMPORT_SESSION}-${i}`,
  }));
}

/** Legacy ProgressState (the old, still-demo-only engine) -> CharacterProgress. */
export function toCharacterProgressFromGuest(state: ProgressState): CharacterProgress {
  const almostAt = hoursFromIso(state.almostAt);
  return {
    characterId: state.kanji,
    status: state.status,
    lamps: { ...state.lights },
    encountered: state.encounterCompleted,
    understood: state.understandCompleted,
    repairs: [...state.repairRequiredKinds],
    lostFlag: state.status === "lost",
    consecutiveWrong: { ...state.consecutiveWrongByKind },
    lifetimeWrong: { ...state.wrongCountByKind },
    almostAt,
    almostSessionId: almostAt === null ? null : GUEST_IMPORT_SESSION,
    echoes: reconstructEchoes(state, almostAt),
    openEcho: null,
    seenSurfaces: [...state.surfacesSeenSuccess],
    novelFailures: [],
    stampedAt: hoursFromIso(state.perfectAt),
  };
}

// "Higher" = closer to かんぺき. まよい ranks below はじめて: a character
// the engine had to flag as needing repair is a worse place to be starting
// from than one never attempted, so a brand-new account's `new` row is kept
// over an imported `lost` one on a genuine tie — though for the one call
// site this actually has today (a freshly created child, `new` on every
// character), the guest side already wins outright in every case that
// matters; this ordering only governs a future re-import against a child
// that already has real progress.
const STATUS_RANK: Record<Status, number> = { lost: 0, new: 1, fix: 2, almost: 3, perfect: 4 };

/**
 * Per-character merge: the higher status wins; a tie keeps whichever side's
 * almostAt is earlier, so an echo clock already running is never reset.
 */
export function mergeGuestProgress(
  existing: CharacterProgress,
  guest: CharacterProgress,
): CharacterProgress {
  const existingRank = STATUS_RANK[existing.status];
  const guestRank = STATUS_RANK[guest.status];
  if (guestRank !== existingRank) return guestRank > existingRank ? guest : existing;
  if (existing.almostAt === null) return guest.almostAt === null ? existing : guest;
  if (guest.almostAt === null) return existing;
  return existing.almostAt <= guest.almostAt ? existing : guest;
}
