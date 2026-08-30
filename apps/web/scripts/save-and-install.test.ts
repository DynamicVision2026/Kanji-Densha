import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// work-order-child-home.md Task 4 — "the guest import must not be blocked
// by email verification. Save first, verify later." server.ts is the
// pre-wired Better Auth config (not touched by this task); this asserts
// the invariant it already holds, so a future edit that adds
// requireEmailVerification would be caught here rather than discovered
// live.
test("email/password sign-up never requires email verification before use", () => {
  const server = readFileSync("src/lib/auth/server.ts", "utf8");
  assert.equal(/requireEmailVerification/.test(server), false);
});

test("onboard's guest-progress import is never gated on emailVerified", () => {
  const onboard = readFileSync("src/routes/onboard.tsx", "utf8");
  assert.match(onboard, /importGuestProgress/);
  assert.equal(/emailVerified/.test(onboard), false);
});

test("save prompt stays above つぎへ, never replacing it", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /showSavePrompt \? \(\s*<SavePromptBanner/);
});

test("じぶんの えきを つくる is wired right after the save prompt, independently dismissible", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /HomeScreenPrompt/);
  // Two distinct state slots — declining one must not hide the other.
  assert.match(session, /installPromptVisible/);
  assert.match(session, /savePromptVisible/);
  const savePromptIdx = session.indexOf("<SavePromptBanner");
  const installPromptIdx = session.indexOf("<HomeScreenPrompt");
  assert.ok(savePromptIdx >= 0 && installPromptIdx > savePromptIdx);
});

test("HomeScreenPrompt falls back to manual instructions on iOS, where beforeinstallprompt never fires", () => {
  const prompt = readFileSync("src/components/home-screen-prompt.tsx", "utf8");
  assert.match(prompt, /beforeinstallprompt/);
  assert.match(prompt, /installIosHint/);
  assert.match(prompt, /display-mode: standalone/);
});
