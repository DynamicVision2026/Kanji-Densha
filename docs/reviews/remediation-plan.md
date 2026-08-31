# Remediation — launch blockers

Five blockers. No launch until all five are closed with evidence. One PR each, in this
order, because 1 and 2 are live defects and 4 and 7 are one-line conditions.

Evidence rule, applied to every fix in this document: a fix is not done when the code
compiles. It is done when a command demonstrates the old behaviour failing and the new
behaviour passing, and that output is in the PR body. Anything reported without pasted
output is treated as unstarted.

## R1 — `BETTER_AUTH_SECRET` must not have a fallback (audit E3, C4)

**The defect.** `auth/server.ts:177` falls back to `previewAuthSecret()` = `randomBytes(32)`
per process. The Cloud Run workflow sets only `DATABASE_URL`. So every revision — and every
instance within a revision — signs sessions with a different secret. Sessions do not survive
a redeploy, and under multi-instance scaling they do not survive a page load.

**Fix.**

1. In `auth/server.ts`, if `NODE_ENV === "production"` and `BETTER_AUTH_SECRET` is unset,
   `throw` at startup with a message naming the variable. Same for `DATABASE_URL` — a
   production process must never silently use PGLite.
2. Create the secret in Secret Manager; add `--set-secrets BETTER_AUTH_SECRET=…:latest` to
   the deploy workflow.
3. Audit every remaining fallback in C4 and apply the same rule: development convenience,
   production failure.

**Evidence required.**

- The container started with `NODE_ENV=production` and no secret: paste the startup crash.
- The same container with the secret set: paste it serving.
- Two consecutive deploys, then a sign-in that survives the second: paste the session
  cookie persisting across revisions.

## R2 — `computeEchoDueAt` unit mismatch (audit B1, F2)

**The defect.** `legacy-progress-adapter.ts:51` computes
`almostAt + echoFirstDelayHours * 3_600_000`, treating an hours-valued engine parameter
against a millisecond timestamp. The UI computes one due time; the engine enforces another
(`evaluate.ts` works in hours). The interface offers echoes the engine then rejects — a
second scheduler, on both paths.

**Fix.** One conversion, one place. Either the adapter converts hours→ms correctly, or
better, it calls a single exported helper from `packages/engine` so there is exactly one
implementation of echo eligibility. Prefer the second: this is the same "two of everything"
fault and the fix should remove the duplicate, not correct it.

**Evidence required.** A test that computes a due time via the UI path and via the engine
for the same progress, asserting equality. Paste it failing before the fix and passing
after. Then a live guest ride reaching だいたい, with the ticket's printed return date and
the engine's eligibility boundary shown to be the same instant.

## R3 — `/app/kanji` and `/app/mistakes` skip child resolution (audit B4, A4)

**The defect.** Both read `readActiveChildId()` directly and render a skeleton when it is
empty — no `StationBoard`, so a multi-profile household can land on the wrong child or on an
infinite skeleton. The Step 2 gate does not fire because it forbids components from
resolving a child and these are routes.

**Fix.** Mount `StationBoard` on both, exactly as the other five `/app` routes do. Then
extend the gate: every route that reads `readActiveChildId()` must also render
`StationBoard`. That is the check that would have caught this.

**Evidence required.** The extended gate failing on the current code, then passing after.
Plus a two-profile household walked through both routes.

## R4 — 到着 chrome is guest-only (audit A4)

**The defect.** `kanji-session.tsx:190,203` gate `SessionStub`, `SavePromptBanner` and
`HomeScreenPrompt` on `hrefHome === "/demo"`. An account child never receives a ticket and
never receives the home-screen prompt.

**Ruling.** The save prompt is correctly guest-only — an account holder has already saved.
The ticket and the install prompt are not. The ticket is the return mechanism for every
child, and the install prompt is what protects an account child's session from Safari's
storage eviction. Both must render on both paths.

**Evidence required.** An account child reaching 到着 with the ticket and install prompt
visible, and no save prompt. Screenshot plus the condition diff.

## R5 — `ux-ia.test.ts` is red and its assertion is stale (audit D1, D2)

**The defect.** The test asserts `Navigate to="/demo"` in `index.tsx`. The product correctly
re-renders at `/` per `entrance-page.md`. The test encodes superseded behaviour, has been
red all week, and was dismissed as noise — by me, three times.

**Fix.** Update the assertion to the current contract and rename the case to describe what
it now protects. Then audit the other stale-but-green tests the audit named:
`e2e/ride.spec.ts` (tests `LocalStore` and a `/` 山 ride that no longer exist) and
`child-profiles.test.ts` (reachable-files list omits the ticket and siding).

**Evidence required.** Full test output showing zero failures on `main`. A green suite is
now the launch gate — no more "one known pre-existing failure."

## Handoff verification protocol — permanent

Applies to every PR from here, mine and engineering's.

1. Claims require pasted output. "Verified", "confirmed", "works" without a command and its
   result is treated as unverified. This applies to my design documents too — anything I
   assert about the codebase carries the command that showed it, or is written as a
   hypothesis to be checked.
2. Every fix demonstrates the failure first. Show the defect reproducing, then the fix
   passing. A test that has never been seen to fail is not known to work.
3. A gate accompanies every structural fix. If a class of bug was possible, it stays
   possible until CI forbids it. R3 extends a gate; R1 and R2 should too.
4. The suite is green or the branch does not merge. Known-failing tests are abolished as a
   category. A test that is wrong gets fixed or deleted, never tolerated.
5. Cross-path parity is checked explicitly. Any feature touching the child experience is
   verified on both the guest and the account path before the PR opens. Three of this week's
   defects were "built on one path only."
6. The architect verifies, not just specifies. I ruled on the auth fallback days ago and did
   not track that it landed. Every ruling I make now carries the evidence I expect back, and
   I check it against that.

## Launch gate

All five closed with evidence, `pnpm verify` green, full test suite green, `/health`
returning the deployed SHA, and one guest ride plus one account ride walked end to end on a
phone against the deployed revision.

Not before.
