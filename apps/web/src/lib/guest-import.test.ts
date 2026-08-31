import { describe, expect, it } from "vitest";
import { mergeGuestProgress } from "./guest-import.js";
import { initialProgress } from "@kanji-densha/engine";

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
