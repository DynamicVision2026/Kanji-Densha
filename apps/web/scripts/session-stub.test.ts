import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { earliestEchoDueAt, type SessionRide } from "../src/lib/session-stub.ts";

test("earliestEchoDueAt picks the earliest non-null due date", () => {
  const rides: SessionRide[] = [
    { char: "一", echoDueAt: "2026-09-05T00:00:00.000Z" },
    { char: "右", echoDueAt: "2026-09-02T00:00:00.000Z" },
    { char: "雨", echoDueAt: null },
  ];
  assert.equal(earliestEchoDueAt(rides), "2026-09-02T00:00:00.000Z");
});

test("earliestEchoDueAt is null when nothing in the session has an echo scheduled", () => {
  assert.equal(earliestEchoDueAt([{ char: "一", echoDueAt: null }]), null);
});

// return-ticket.md: "Status | だいたい — never かんぺき, which is days away."
// The stub structurally cannot show かんぺき — it never reads any
// character's actual status, so there is nothing to clamp.
test("SessionStub renders a fixed だいたい status, never derived from any character's actual status", () => {
  const src = readFileSync("src/components/session-stub.tsx", "utf8");
  assert.match(src, /statusAlmost/);
  assert.equal(/\.status\b/.test(src), false);
});

test("session ticket is offered before the save prompt, per return-ticket.md", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  const ticketIdx = session.indexOf("<SessionStub");
  const saveIdx = session.indexOf("<SavePromptBanner");
  assert.ok(ticketIdx >= 0 && saveIdx > ticketIdx);
});

test("declining the ticket costs nothing — its own dismiss, independent of the save prompt", () => {
  const stub = readFileSync("src/components/session-stub.tsx", "utf8");
  assert.match(stub, /onDecline/);
  assert.match(stub, /data-session-stub-decline/);
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /ticketVisible/);
});
