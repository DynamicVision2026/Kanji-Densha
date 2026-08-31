# Routing and state — the cutover

Written 2026-08-31 during launch triage; corrected 2026-08-31 against
`docs/reviews/verification-report.md`'s findings. Diagnostic, then target, then how we prove it.
Every claim below has either been confirmed by demonstration, confirmed by inspection, or
corrected against what the code actually does — the verification report cites which for each.

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

**Two stores, and this is expected, not itself the defect.** Guest progress lives in one
localStorage key (`densha.demo.progress.v3`, owned by `demo-progress.ts`); account progress lives
server-side (`apps/web/src/lib/server/progress.ts`, Postgres/Neon). A guest/account split
necessarily has different persistence per side — that isn't the flaw. The flaw is that the guest
side's persistence is wired to the legacy evaluator instead of the real one.

**The target architecture for the guest side already exists, built and tested, and is unused.**
`packages/store` is a complete `ProgressStore` implementation — `LocalStore` (localStorage) calls
`@kanji-densha/engine`'s real `evaluateProgress`, has its own test file, and its own comments cite
architecture §3 and I5 directly. **Zero files in `apps/web` import `@kanji-densha/store`.** This
was evidently built for an earlier milestone and never wired in. The work below is connecting it
and deleting what it replaces — not designing new infrastructure.

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

Exactly as `architecture.md` §3 specified before the harvest:

**One engine.** `evaluateProgress` in `packages/engine` is the only evaluator.
`progress-eval.ts` and `demo-progress.ts`'s scoring are deleted, not deprecated.

**One store, two adapters — the interface already exists.**

```ts
// packages/store/src/types.ts — already written, already tested
interface ProgressStore {
  load(childId): Promise<Record<string, CharacterProgress>>;
  apply(childId, characterId, event): Promise<CharacterProgress>;
}
```

`LocalStore` (guest, localStorage) is built. `RemoteStore` (account, database) is the piece that
doesn't exist yet — `apps/web/src/lib/server/progress.ts` does the equivalent job today but not
behind this interface. Both call the same engine. **The UI never knows which one it has.**

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
signed in                     → /home  (RemoteStore)
hasRidden flag present        → /home  (LocalStore)
otherwise                     → entrance page
```

Multiple profiles resolve inside `/home` per D-ruling 2 — remembered child, board only on
first open or explicit switch.

## 3. Cutover order

Deleting is the work. Each step is independently shippable.

1. **Guest path onto the real engine.** `LocalStore` (already built) is wired into the guest
   path. Delete `progress-eval.ts` and the legacy scoring in `demo-progress.ts`. Discard existing
   guest localStorage rather than migrating it — nobody has real guest data yet, and migrating
   between two disagreeing engines risks corrupting whatever *is* there for no gain.
2. **Fix the resolver duplication concretely confirmed above**, before collapsing routes: give
   `catalog.tsx`, `stamps.tsx`, `workshop.tsx` the same remembered-active-child resolution
   `app/index.tsx` already has, rather than falling back to the first-created child.
3. **Collapse the routes.** `/demo/*` redirects to its `/` equivalent for one release, then is
   deleted.
4. **Delete the orphan.** `DepartureBoardView`.
5. **One resolver** at `/`, per §2.

## 4. How we prove it — structural, not manual

Manual clicking will not settle this; it is what let two of everything survive a week. The
proof is CI, in the same style as the engine-purity gate.

- **No module outside `packages/engine` may compute a status.** Grep gate: no occurrence of
  `'perfect'|'almost'|'fix'|'lost'` as an assignment target outside the engine and the
  `toTrainCar` mapping.
- **`demo-progress` is importable only by `LocalStore`.** Boundary lint rule.
- **The route tree matches the canonical table in §2**, asserted by a test that enumerates the
  generated route tree and diffs against a checked-in list. A new route is a deliberate edit to
  that list, not an accident.
- **One end-to-end path per persona**: guest ride → 到着 → ticket; register → import →
  `/home`; returning signed-in child → `/home`.

## 5. Division of labour

**Architect:** the canonical route table and invariants above.
**Engineering:** produced the actual current route inventory (see
`docs/reviews/verification-report.md`) — every file under the routes directory, what each
renders, which store and which engine it reads, cross-checked against this table rather than
guessed at.

The diff between the two, now that both exist, is the work list in §3.
