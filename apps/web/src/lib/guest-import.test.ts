import { describe, expect, it } from "vitest";
import { mergeGuestProgress, toCharacterProgressFromGuest } from "./guest-import.js";
import { emptyProgress } from "./progress-eval.js";
import { initialProgress } from "@kanji-densha/engine";
import type { ProgressState } from "./progress-eval.js";

function guestState(patch: Partial<ProgressState>): ProgressState {
  return { ...emptyProgress("水"), ...patch };
}

describe("toCharacterProgressFromGuest", () => {
  it("carries status, lamps, and repairs through unchanged", () => {
    const guest = guestState({
      status: "fix",
      lights: { reading: true, meaning: true, shape: false },
      repairRequiredKinds: ["shape"],
      encounterCompleted: true,
      understandCompleted: true,
    });
    const out = toCharacterProgressFromGuest(guest);
    expect(out.status).toBe("fix");
    expect(out.lamps).toEqual({ reading: true, meaning: true, shape: false });
    expect(out.repairs).toEqual(["shape"]);
    expect(out.lostFlag).toBe(false);
  });

  it("sets lostFlag from status, matching the real engine's own MR-4.5 write", () => {
    const guest = guestState({ status: "lost" });
    expect(toCharacterProgressFromGuest(guest).lostFlag).toBe(true);
  });

  it("converts almostAt from an ISO string to engine hours", () => {
    const iso = "2026-08-20T00:00:00.000Z";
    const guest = guestState({ status: "almost", almostAt: iso });
    const out = toCharacterProgressFromGuest(guest);
    expect(out.almostAt).toBe(Date.parse(iso) / 3_600_000);
    expect(out.almostSessionId).not.toBeNull();
  });

  it("reconstructs one synthetic successful echo when echoSuccessCount is 1, anchored no later than almostAt", () => {
    const iso = "2026-08-20T00:00:00.000Z";
    const guest = guestState({ status: "almost", almostAt: iso, echoSuccessCount: 1 });
    const out = toCharacterProgressFromGuest(guest);
    expect(out.echoes).toHaveLength(1);
    expect(out.echoes[0]!.ok).toBe(true);
    expect(out.echoes[0]!.at).toBeLessThanOrEqual(out.almostAt!);
  });

  it("reconstructs two successful echoes for a perfect guest character, matching MR-7.3's okEchoCount>=2 requirement", () => {
    const guest = guestState({
      status: "perfect",
      almostAt: "2026-08-10T00:00:00.000Z",
      perfectAt: "2026-08-20T00:00:00.000Z",
      echoSuccessCount: 2,
    });
    const out = toCharacterProgressFromGuest(guest);
    expect(out.echoes.filter((e) => e.ok)).toHaveLength(2);
    expect(out.stampedAt).toBe(Date.parse("2026-08-20T00:00:00.000Z") / 3_600_000);
  });

  it("never reconstructs echoes for a character with no almostAt", () => {
    const guest = guestState({ status: "new" });
    expect(toCharacterProgressFromGuest(guest).echoes).toHaveLength(0);
  });
});

describe("mergeGuestProgress", () => {
  it("takes the guest's status when it outranks the existing one — the brand-new-child case", () => {
    const existing = initialProgress("水"); // status "new"
    const guest = { ...initialProgress("水"), status: "almost" as const };
    expect(mergeGuestProgress(existing, guest).status).toBe("almost");
  });

  it("keeps the existing status when it already outranks the guest's", () => {
    const existing = { ...initialProgress("水"), status: "perfect" as const };
    const guest = { ...initialProgress("水"), status: "fix" as const };
    expect(mergeGuestProgress(existing, guest)).toBe(existing);
  });

  it("on a status tie, keeps the side with the earlier almostAt so an echo clock is never reset", () => {
    const earlier = { ...initialProgress("水"), status: "almost" as const, almostAt: 100 };
    const later = { ...initialProgress("水"), status: "almost" as const, almostAt: 200 };
    expect(mergeGuestProgress(earlier, later)).toBe(earlier);
    expect(mergeGuestProgress(later, earlier)).toBe(earlier);
  });

  it("ranks まよい (lost) below はじめて (new) — a fresh child's row beats an imported lost one on a tie-break by status", () => {
    const existing = initialProgress("水"); // "new"
    const guest = { ...initialProgress("水"), status: "lost" as const };
    expect(mergeGuestProgress(existing, guest)).toBe(existing);
  });
});
