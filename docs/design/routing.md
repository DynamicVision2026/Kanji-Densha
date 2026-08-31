# Routing and state — the cutover

Written 2026-08-31 during launch triage; corrected 2026-08-31 against
`docs/reviews/verification-report.md`'s findings; updated 2026-08-31 after step 1 of §3 shipped
(#36) with what that step actually did, where it deliberately departed from this document's
original plan, and why. Diagnostic, then target, then how we prove it. Every claim below has
either been confirmed by demonstration, confirmed by inspection, or corrected against what the
code actually does — the verification report cites which for each.

---

## 1. The flaw, as confirmed

**Two engines.** `demo-progress.ts` runs the legacy `progress-eval.ts` for guests; account users
run `packages/engine`. Both files export a function literally named `evaluateProgress`, with
different signatures and independently maintained rules — nothing about an import line tells you
which mastery rules govern a given screen. **Confirmed by demonstration, not inference:** running
the identical scenario (だいたい → one clean 再訪 round → one wrong lamp on the second round)
through both produces the same surface status (`fix`) but a different amount of remaining work —
the real engine preserves the first successful echo (`okEchoCount: 1`, one more clean round to
かんぺき); the legacy engine resets `echoSuccessCount` to `0` (two more rounds needed). A guest and
an account holder making the identical single mistake get different answers about how close they
are. This is invariant I5 violated in production, on the path every visitor takes first, and it
alone justifies the engine-unification work regardless of anything else in this document.

A third, narrower construction path also exists: `demo-progress.ts`'s seed function writes
`status: "perfect"` etc. as hand-built object literals for the pre-populated demo/tour
characters, bypassing both evaluators at seed time. Worth naming, not worth treating as equal in
scope to the other two — it fires once, not on every interaction.

**What this actually cost, said plainly.** MR-6.3 and D9 are not new rules — they have governed
the account path since M1. MR-6.3: a failed echo round unlights and repairs the lamp, taking
status to なおし, even when the individual wrong answer is exempt from the wrong counters (a
novel-surface failure, MR-6.4). D9: a soft item (似た駅名 and kin) can repair a lamp but never
light one. Neither rule reached a guest, ever, because the guest path never ran the engine they
belong to. That means every guest until this week — including the child in any session run
against this build, and anyone who has touched the preview — was learning under different rules
than every account holder. Guest mode was not a lighter version of the product; it was a
different product wearing the same interface. That is the concrete answer to what the two-engine
defect was costing, and the argument for having fixed it before launch rather than after.

**Two stores, and this is expected, not itself the defect.** Guest progress lives in one
localStorage key (`densha.demo.progress.v4` as of #36, owned by `demo-progress.ts`); account
progress lives server-side (`apps/web/src/lib/server/progress.ts`, Postgres/Neon). A
guest/account split necessarily has different persistence per side — that isn't the flaw. The
flaw was that the guest side's persistence was wired to the legacy evaluator instead of the real
one — fixed in step 1 below.

**A `ProgressStore` implementation already exists, built and tested, and remains unused —
deliberately, as of step 1.** `packages/store`'s `LocalStore` calls `@kanji-densha/engine`'s real
`evaluateProgress` and its comments cite architecture §3 and I5 directly, but its `load`/`apply`
are `Promise`-returning — built for a future `RemoteStore` that will genuinely need to await a
network call. The guest UI reads progress *synchronously*, at render time and inside `useState`
initializers, throughout (`guest-home.tsx`, `kanji-session.tsx`, `kanji.$char.tsx`). Wiring
`LocalStore` in as originally planned here would have meant converting every one of those
call sites to an async loading pattern — a materially larger, higher-regression-risk change than
the actual defect required. §2 below records what step 1 did instead.

**One route tree, mostly already shared — corrected from the original diagnosis.** `/demo/*`
mirrors `/app/*` file-for-file, but the *presentation layer underneath both trees is already a
single shared implementation*: `ChildHome`, `KanjiSession`, `ParentReportView`,
`ParentForwardView`, `GradeRolloverCard`, `StartBandPicker`, `catalog-page`, `stamp-book`,
`phonetic-workshop`, and all three shells (`app-shell`, `child-shell`, `ride-shell`) are each one
component, rendered by both trees. `GuestHome` is explicit about this in its own file comment:
"one implementation, two routes, so they cannot drift apart." **What's actually duplicated is
route-level resolver logic** — each route independently re-fetches the child list and re-decides
which one is active, rather than sharing one resolution. This is confirmed with a live example:
this week's multi-profile fix (remember the active child, show the picker only on first
open/explicit switch) was applied to `app/index.tsx` and nowhere else. `app/catalog.tsx`,
`app/stamps.tsx`, and `app/workshop.tsx` each carry their own, older copy of the same resolver
pattern, and each falls back to the household's *first-created* child instead of the currently
active one — a real, currently-shippable inconsistency, not a hypothetical.

**One orphan, not a second shell system.** `apps/web/src/components/departure-board.tsx`'s
`DepartureBoardView` (発車標, the old departure-board screen) is exported but imported nowhere in
`apps/web/src` — dead code, unreachable by any route. The originally-hypothesised "legacy parent
door alongside the new 保護者 control" and "legacy shell" do not hold against the code: exactly
one `ParentDoor` exists, used identically by both trees, and exactly one of each shell exists. The
visible 保護者 link and `ParentDoor`'s long-press are two different, both-intentional affordances
for the same destination (an existing test asserts both are present on purpose), not a legacy/new
pair.

**Root cause, stated once, unchanged by the corrections above:** guest-ness was implemented as a
*route space* when it is a *storage adapter*. The two-engine problem and the resolver-duplication
problem both follow from that single mistake.

## 2. Target — one of everything

Exactly as `architecture.md` §3 specified before the harvest, with one deliberate departure
recorded below rather than silently taken:

**One engine — done.** `evaluateProgress` in `packages/engine` is the only evaluator anywhere in
the app. `progress-eval.ts` is deleted; `demo-progress.ts`'s scoring is deleted and replaced with
calls to the real engine. This is the part of §2 that actually mattered, and it shipped in #36.

**One store, two adapters — the interface exists; step 1 did not adopt it for the guest side.**

```ts
// packages/store/src/types.ts — already written, already tested
interface ProgressStore {
  load(childId): Promise<Record<string, CharacterProgress>>;
  apply(childId, characterId, event): Promise<CharacterProgress>;
}
```

The plan going into step 1 was `LocalStore` (guest, localStorage) behind this interface, with
`RemoteStore` (account, database) as the still-missing piece `apps/web/src/lib/server/progress.ts`
does the equivalent job of today, outside the interface. That plan named `LocalStore` because it
exists, not because its call shape had been checked against the guest UI's — it hadn't. It reads
progress synchronously, and this interface is `Promise`-based. Step 1 wires `demo-progress.ts`
straight to `evaluateProgress` plus `legacy-progress-adapter.ts`, the same direct-call shape
`server/progress.ts` already uses instead of `RemoteStore`. **Both sides of the split now use the
same pattern** — arguably more consistent than the originally planned mix of one direct-call side
and one `ProgressStore` side would have been. The `ProgressStore` interface stays as written,
unused by either side, pending one of two follow-ups, neither decided here: give it a
synchronous-capable shape a localStorage adapter can honor without an async rewrite of the guest
UI, or retire it if `RemoteStore` never gets built either. Either way, **the UI never knows which
storage it has** — that property held throughout step 1 regardless of which pattern got it there.

**One route tree.** No `/demo/*`. A guest and an account holder visit identical URLs; only the
injected adapter differs.

```
/                 entry resolver — the only place entry is decided
/parents          public parent explainer
/login            authentication
/onboard          registration + guest import
/home             child home: train, siding, ticket
/kanji/$char      the ride, four beats
/map              route map
/stamps           stamp book
/catalog          kanji reference catalog
/workshop         phonetic-family workshop
/mistakes         recent-mistakes review
/parent/*         parent surface (authenticated)
```

`/catalog`, `/workshop`, and `/mistakes` are added here from the verification report's route
inventory — they are real, currently-reachable routes the original table omitted entirely. They
are placed at top level, as siblings of `/stamps`, because that is where `/stamps` itself already
sits in this table despite currently rendering inside `AppShell` (the parent-facing chrome) —
today's `/app/stamps`, `/app/catalog`, `/app/workshop`, and `/app/mistakes` all use `AppShell`
identically. This table does not change that; it only gives the three omitted routes the same
top-level placement their sibling already had. Whether any of the four should move under
`/parent/*` or gain a child-facing treatment is a separate design question, not decided here.

**One resolver.** `/` decides, and nothing else does:

```
signed in                     → /home  (account persistence)
hasRidden flag present        → /home  (guest persistence)
otherwise                     → entrance page
```

Multiple profiles resolve inside `/home` per D-ruling 2 — remembered child, board only on
first open or explicit switch.

## 3. Cutover order

Deleting is the work. Each step is independently shippable.

1. **✅ Shipped (#36). Guest path onto the real engine.** `progress-eval.ts` deleted;
   `demo-progress.ts`'s scoring deleted and replaced with direct calls to
   `@kanji-densha/engine`'s `evaluateProgress` plus `legacy-progress-adapter.ts` — not `LocalStore`,
   per §2's note above. Guest localStorage moved `densha.demo.progress.v3` → `.v4` and old data was
   discarded, not migrated, as planned. Also surfaced, not introduced: guest mode had never been
   subject to MR-6.3 or D9 (see §1) — both now apply, so a guest ride is measurably stricter than
   it was. Watch a full guest ride to だいたい on a deployed build and confirm it is still reachable
   in one sitting before treating this as closed; if it isn't, that is a grade-parameter question,
   not a rules question.
2. **✅ Shipped (#38). Fixed the resolver duplication.** `catalog.tsx`, `stamps.tsx`,
   `workshop.tsx`, and a fourth instance found while checking (`parent.tsx`, arguably the most
   serious — a parent could see another child's report with no indication it wasn't the one they
   meant) now share `app/index.tsx`'s remembered-active-child resolution via one hook,
   `useActiveChild` in `active-child.ts`, instead of each falling back to the first-created child.
   Checked for a fifth instance by grepping every reader of the active-child primitives across
   `apps/web/src`: all seven call sites are routes; every presentational component is prop-driven.
   None found.
3. **Collapse the routes.** `/demo/*` redirects to its `/` equivalent for one release, then is
   deleted. Not started — later work, not part of this week's four steps.
4. **✅ Shipped. Deleted the orphan.** `DepartureBoardView` — confirmed still unreferenced,
   removed along with its exclusive i18n strings (`boardTitle` stays; `departure-ticket.tsx` also
   reads it). `apps/web/src/lib/departure-board.ts` (the data/scheduling module, `buildDepartureBoard`)
   is untouched — it was never the orphan, only the `.tsx` view was.
5. **One resolver** at `/`, per §2. Not started — later work, not part of this week's four steps.

## 4. How we prove it — structural, not manual

Manual clicking will not settle this; it is what let two of everything survive a week. The
proof is CI, in the same style as the engine-purity gate.

**✅ Shipped.** `scripts/check-routing-invariants.mjs` at the repo root, wired into `pnpm verify`
as `check:routing-invariants`, same blunt-textual-gate style as `check-engine-purity.mjs`:

- **No module outside `packages/engine` may compute a status.** No occurrence of
  `status: "perfect"|"almost"|"fix"|"lost"` (or `status = "..."`) outside the engine, with two
  named exceptions carried over from §1's hand-built-literal note — `demo-progress.ts`'s seed
  function and the `dev/practice-card-states.tsx` review gallery. (`toTrainCar` turned out not to
  need an exception: it reads `status`, never assigns a literal.)
- **`demo-progress.ts` is the only caller of `evaluateProgress` on the guest side, as
  `server/progress.ts` is on the account side.** No third module may import
  `@kanji-densha/engine`'s `evaluateProgress` directly. (Originally phrased as "importable only by
  `LocalStore`"; corrected per §2 — that class is not in the call path.)
- **The active child is resolved in one place, and nothing else may derive it.** No module
  outside `apps/web/src/routes/` may import `active-child.ts`'s primitives — the direct consequence
  of step 2's finding that this resolution had drifted into five separate copies before
  `useActiveChild` existed. Verified empirically before being written as a gate: every
  presentational component in the app is prop-driven; none resolves a child on its own.
- **The route tree matches a checked-in list**, asserted by `check-routing-invariants.mjs`
  enumerating `apps/web/src/routes/` and diffing against `CANONICAL_ROUTES` in that script. This
  locks in today's actual dual-tree inventory (`/app/*` + `/demo/*`), not yet the single post-
  collapse tree from §2 — steps 3 and 5 haven't happened. Update the list when they do.

**Not done.** One end-to-end path per persona (guest ride → 到着 → ticket; register → import →
`/home`; returning signed-in child → `/home`) needs real Playwright E2E infrastructure this repo
doesn't have yet — a test runner wired into CI, a running built app, and a test-database story for
the two authenticated personas. The guest-ride check done by hand for step 1 (a local dev server,
driven by a throwaway script, confirming だいたい is reachable in one sitting) is a one-time
verification, not this gate; it ran against neither CI nor the actual deployed preview. Standing
this up is a real decision (which test DB, which CI job, how long it can take) that hasn't been
made, not an oversight.

**Also shipped, not originally in this list.** A `/health` endpoint (`apps/web/src/routes/health.ts`)
returning `{ status, sha, shortSha, buildTime }`. `.git` is dockerignored, so the SHA can't be
computed inside the container — `scripts/write-build-info.mjs` runs on the CI runner (real git
access) before either `gcloud run deploy --source .` step, writing
`apps/web/public/build-info.json`, which rides through the build as an ordinary file and Vite
copies into `.output/public/`. One URL answers "is the new version actually live" instead of a
screenshot.

## 5. Division of labour

**Architect:** the canonical route table and invariants above.
**Engineering:** produced the actual current route inventory (see
`docs/reviews/verification-report.md`) — every file under the routes directory, what each
renders, which store and which engine it reads, cross-checked against this table rather than
guessed at.

The diff between the two, now that both exist, is the work list in §3.
