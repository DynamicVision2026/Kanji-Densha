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

// child-home-and-sessions.md §4 review ruling on #27: "Give the stub the
// moment alone: after 到着, the stub appears with 「きっぷを もらう」, and the
// save prompt follows after the child interacts with it or dismisses it —
// not stacked simultaneously." Supersedes the earlier "offered before"
// ordering check: rendering order alone can't prove they never overlap,
// since both used to mount together on the same arrival.
test("the ticket gets the arrival moment alone; the save prompt only arms after it", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  const ticketIdx = session.indexOf("<SessionStub");
  const saveIdx = session.indexOf("<SavePromptBanner");
  assert.ok(ticketIdx >= 0 && saveIdx > ticketIdx);
  // the first-almost-arrival effect must arm only the ticket...
  const arrivalEffect = session.slice(
    session.indexOf("if (hrefHome === \"/demo\" && progress.status === \"almost\""),
    session.indexOf("function advanceFromTicket"),
  );
  assert.match(arrivalEffect, /setTicketVisible\(true\)/);
  assert.equal(/setSavePromptVisible/.test(arrivalEffect), false);
  // ...and advanceFromTicket — the only path to the save prompt — must
  // also retire the ticket in the same update, so they never coexist.
  const advanceFn = session.slice(
    session.indexOf("function advanceFromTicket"),
    session.indexOf("const showSavePrompt"),
  );
  assert.match(advanceFn, /setTicketVisible\(false\)/);
  assert.match(advanceFn, /setSavePromptVisible\(true\)/);
});

test("both the ticket's save and its あとで lead to advanceFromTicket", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /onSaved=\{advanceFromTicket\}/);
  assert.match(session, /onDecline=\{advanceFromTicket\}/);
});

test("declining the ticket costs nothing — its own dismiss, independent of the save prompt", () => {
  const stub = readFileSync("src/components/session-stub.tsx", "utf8");
  assert.match(stub, /onDecline/);
  assert.match(stub, /data-session-stub-decline/);
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /ticketVisible/);
});
