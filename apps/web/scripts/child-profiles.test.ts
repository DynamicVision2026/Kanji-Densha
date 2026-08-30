import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// child-home-and-sessions.md §4 / work-order-child-home.md Task 3 —
// "no password, PIN, or credential ever appears on the child path."
// login.tsx (the parent's own sign-in) is deliberately excluded: it is
// never reached by tapping through a child route.
//
// This branch was cut from main before #23/#24 (the ticket-anchor child
// home and its siding) land, so it checks the child-home.tsx/
// home-line-strip.tsx that exist here now. Once those PRs merge,
// departure-ticket.tsx and train-line.tsx become child-reachable too and
// belong in this list.
const CHILD_REACHABLE_FILES = [
  "src/components/child-home.tsx",
  "src/components/station-board.tsx",
  "src/components/home-line-strip.tsx",
  "src/components/parent-door.tsx",
  "src/routes/app/index.tsx",
  "src/routes/demo/index.tsx",
];

test("no credential input is reachable from any child route", () => {
  for (const file of CHILD_REACHABLE_FILES) {
    const src = readFileSync(file, "utf8");
    assert.equal(
      /type=["']password["']/.test(src),
      false,
      `${file} must never render a credential input`,
    );
  }
});

test("station board shows one real button per child, tap to enter", () => {
  const board = readFileSync("src/components/station-board.tsx", "utf8");
  assert.match(board, /<button/);
  assert.match(board, /onSelect/);
  assert.match(board, /gradeLabel/);
  assert.match(board, /perfectCount/);
});

test("app home shows the station board only with more than one profile", () => {
  const home = readFileSync("src/routes/app/index.tsx", "utf8");
  assert.match(home, /StationBoard/);
  assert.match(home, /childrenQ\.data\.length > 1/);
  // work-order-child-home.md Task 3: keep both the visible 保護者 link and
  // ParentDoor's hold — child-home.tsx carries both (checked by
  // ux-ia.test.ts's "chrome has no peer nav" test), not this file.
});

// child-home-and-sessions.md §4 review ruling: "Remember the last profile
// and enter it directly; show the board only on first open, or when the
// parent explicitly switches." A remembered, still-valid child must skip
// the board even with 2+ profiles; clearing it (the parent's explicit
// switch) must bring the board back.
test("app home resolves a remembered child directly, skipping the board", () => {
  const home = readFileSync("src/routes/app/index.tsx", "utf8");
  assert.match(home, /readActiveChildId/);
  assert.match(home, /remembered/);
  assert.match(home, /stillValid/);
});

test("parent page offers a switch-child affordance that clears the remembered child", () => {
  const parent = readFileSync("src/routes/app/parent.tsx", "utf8");
  assert.match(parent, /data-switch-child/);
  assert.match(parent, /clearActiveChildId/);
  assert.match(parent, /switchChild/);
  // only worth offering when there is more than one profile to switch to
  assert.match(parent, /childrenQ\.data\.length > 1/);
});
