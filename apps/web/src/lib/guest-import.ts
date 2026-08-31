import type { CharacterProgress, Status } from "@kanji-densha/engine";

// Guest -> account migration — the rule build-plan.md's M7 entry deferred
// defining until echo timestamps existed. Recorded as D27
// (docs/decisions.md): per character, take the higher status; on a tie,
// keep the earlier almostAt so an echo clock already ticking is never reset.
//
// Callers must pass only characters from demo-progress.ts's
// readMigratableProgress() (or equivalently, ids in its touched-character
// set), never the full readAll() blob. That guard is not defensive
// boilerplate: readAll() also contains the seeded demo fixture (一 already
// かんぺき, 右/雨 だいたい, 円 なおし, …) every guest has on first load,
// never having touched any of it. Importing that fabricated かんぺき into a
// brand-new real account would hand it achievements nobody earned.

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
