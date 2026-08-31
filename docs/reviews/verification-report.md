# Verification report — the architectural split

Run against `origin/main` @ `b3edd46` (2026-08-31). Read-only throughout; nothing in the
working tree or the deployed service was changed while producing this.

**Verdict: partially confirmed.** The load-bearing claim — two evaluators disagree about
かんぺき — is confirmed by demonstration, not inference, and is sufficient on its own to
justify the engine-unification work. Several of the *supporting* claims in `routing.md` are
overstated relative to what the code actually shows: the presentation layer is mostly already
shared, not duplicated, and only one orphaned component was found, not the "two shells" claimed.
Details below, in protocol order.

---

## V1 — Count the engines: CONFIRMED, and it's worse than "they might disagree"

Two live evaluators assign `status`, confirmed by grep and by which files import which:

| File | Exports | Called by |
|---|---|---|
| `packages/engine/src/evaluate.ts` | `evaluateProgress(previous, event, params, requiredLamps)` | `packages/store/src/local-store.ts` (unused — see below), `apps/web/src/lib/server/progress.ts` (the real `/app` path) |
| `apps/web/src/lib/progress-eval.ts` | `evaluateProgress(prevInput, event, params)` — **same exported name, different signature, independently reimplemented** | `apps/web/src/lib/demo-progress.ts` — every guest/`/demo` interaction |

Both files export a function literally named `evaluateProgress`. Nothing about an import line
tells you which mastery rules actually govern a given screen; you have to trace the module path.

A third, even more direct construction path also exists: `demo-progress.ts`'s seed function
writes `status: "perfect"` etc. as hand-built object literals for the pre-populated demo/tour
characters (lines ~108–147, ~664), bypassing *both* evaluators entirely for those specific
characters. Narrower in scope than the other two (it only ever fires once, at seed time) but
worth naming since it's a third way かんぺき gets constructed, not two.

### Proof they disagree — real run, not inspection

I ran the identical scenario through both, using each engine's own public API (not hand-forged
internal state): reach だいたい, pass one full 再訪 round cleanly, then get **one lamp wrong**
on the second 再訪 round. This is the exact D2 case the harvest audit flagged.

**Real engine (`packages/engine`) — final state:**
```json
{
  "status": "fix",
  "echoes": [
    { "at": 48, "ok": true, "sessionId": "s1" },
    { "at": 216, "ok": false, "sessionId": "s2" }
  ],
  "repairs": ["reading"],
  "lamps": { "reading": false, "meaning": true, "shape": true }
}
```
`okEchoCount` (successful echoes) is **1** — the first successful round is still on the record.
Once the child repairs 読み and passes one more 再訪 round, they reach かんぺき.

**Legacy engine (`apps/web/src/lib/progress-eval.ts`) — same scenario, final state:**
```json
{
  "status": "fix",
  "echoSuccessCount": 0,
  "repairRequiredKinds": ["reading"],
  "lights": { "reading": false, "meaning": true, "shape": true }
}
```
`echoSuccessCount` is reset to **0**. The prior successful round is erased. This child needs
**two** more successful 再訪 rounds, not one, to reach the same word.

Same input, same surface-level status (`fix`), completely different amount of remaining work to
reach かんぺき. A guest and an account holder who make the identical single mistake get
different answers about how close they are — demonstrated, not asserted.

A second, independent divergence exists in the MR-4.5 lost threshold, confirmed by inspection
(not re-run, since V1 is already settled): the real engine sums `lifetimeWrong` across all three
lamps (`packages/engine/src/evaluate.ts:290`); the legacy engine checks `wrongCountByKind[kind]`
**per lamp** (`progress-eval.ts` in `applyFailureStatus`) against the same threshold constant. A
child who spreads wrong answers across all three lamps can trip `lost` in the real engine while
staying well clear of it in the legacy one, for the same total number of mistakes.

## V2 — Count the stores

Guest progress lives in exactly one key, written and read by exactly one module:
`densha.demo.progress.v3`, owned entirely by `demo-progress.ts`. (Several *other* `densha.demo.*`
keys exist — route/plan/inspection/start-band/history/rollover-dismiss — but those are session
bookkeeping, not mastery state, and aren't part of this question.)

Account-holder progress lives entirely server-side, via `apps/web/src/lib/server/progress.ts`
against Postgres/Neon. There is no second *client-side* store currently wired up for accounts.

**Can a single child have progress in one store and not the other? Yes, by construction, and
this is expected for a guest/account split — not itself the defect.** Before registration,
progress exists only in `densha.demo.progress.v3`. `guest-import.ts` migrates it into the server
row on registration (D27's merge rule). Nothing clears the guest localStorage entry after a
successful import, so a stale copy can persist on the same device — a real but secondary risk,
distinct from V1's finding.

**One important, load-bearing thing already exists and is unused:** `packages/store` is a
complete, tested `ProgressStore` abstraction — exactly what `routing.md` §2 proposes as the
target (`LocalStore`/`RemoteStore`, one interface, both calling the real engine). `LocalStore`
calls `@kanji-densha/engine`'s real `evaluateProgress`, has its own test file, and is fully
built. **Zero files in `apps/web` import `@kanji-densha/store`.** This changes the shape of the
fix: the target architecture for the guest side isn't something to design and build — it's
already written, reviewed (it cites architecture §3 and I5 in its own comments), and sitting
unused since whatever milestone built it. The work is wiring it in and deleting what it replaces,
not inventing it.

## V3 — Route inventory

```
apps/web/src/routes/
  __root.tsx
  index.tsx                    /
  login.tsx                    /login
  onboard.tsx                  /onboard
  parents.tsx                  /parents
  api/auth/$.ts                /api/auth/*  (Better Auth handler)
  dev/practice-card-states.tsx /dev/practice-card-states  (visual QA gallery, dev-only)
  app/route.tsx                /app          (layout: auth gate)
  app/index.tsx                /app/
  app/kanji.$char.tsx          /app/kanji/$char
  app/map.tsx                  /app/map      (redirect shim → /app)
  app/mistakes.tsx             /app/mistakes
  app/parent.tsx                /app/parent
  app/stamps.tsx                /app/stamps
  app/workshop.tsx               /app/workshop
  app/catalog.tsx                 /app/catalog
  demo/index.tsx                /demo/
  demo/kanji.$char.tsx           /demo/kanji/$char
  demo/map.tsx                   /demo/map      (redirect shim → /demo)
  demo/mistakes.tsx               /demo/mistakes
  demo/parent.tsx                  /demo/parent
  demo/stamps.tsx                   /demo/stamps
  demo/workshop.tsx                   /demo/workshop
  demo/catalog.tsx                     /demo/catalog
```

| Route | Renders | Store | Evaluator | Reachable |
|---|---|---|---|---|
| `/` | `EntranceDoor` / `GuestHome` / redirect | localStorage (`hasRidden` only) | — | yes — the one canonical resolver |
| `/login`, `/onboard`, `/parents` | own components | — / server (onboard writes) | — | yes |
| `/app` (layout) | auth gate, `Outlet` | — | — | yes |
| `/app/` | `ChildHome` | server (`server/progress.ts`) | **real engine** | yes |
| `/app/kanji/$char` | `KanjiSession` (shared) | server | **real engine** | yes |
| `/app/map` | redirect → `/app` | — | — | yes (shim, by design — see `ux-ia.test.ts`) |
| `/app/mistakes`, `/app/parent`, `/app/stamps`, `/app/workshop`, `/app/catalog` | shared components (`ParentReportView`, `stamp-book`, `phonetic-workshop`, `catalog-page`) | server | real engine | yes |
| `/demo/` | `GuestHome` (**same component as `/`**) | `densha.demo.progress.v3` | **legacy engine** | yes |
| `/demo/kanji/$char` | `KanjiSession` (**same component as `/app`**) | localStorage | **legacy engine** | yes |
| `/demo/map` | redirect → `/demo` | — | — | yes (shim) |
| `/demo/mistakes`, `/demo/parent`, `/demo/stamps`, `/demo/workshop`, `/demo/catalog` | **same shared components as their `/app` counterparts** | localStorage / client demo-route data | legacy engine | yes |

**Correction to the routing.md hypothesis, stated plainly:** "every screen exists twice" is not
what the code shows. `ChildHome`, `KanjiSession`, `ParentReportView`, `ParentForwardView`,
`GradeRolloverCard`, `StartBandPicker`, `catalog-page`, `stamp-book`, `phonetic-workshop`, and all
three shells (`app-shell`, `child-shell`, `ride-shell`) are each a **single, shared component**
rendered by both the `/app` and `/demo` route. What's actually duplicated is the *route-level
resolver glue* — each route independently re-fetches children and re-decides which one is
active — confirmed with a live example in V4 below. `GuestHome` itself is explicitly documented
in its own file as "one implementation, two routes, so they cannot drift apart," and it does
what it says.

### Delta against `routing.md` §2's canonical table

**Delete:** all of `/demo/*` (7 routes + the redirect shim), per the cutover plan's step 2 —
once `LocalStore` replaces `demo-progress.ts`'s legacy scoring, there's no reason for a
guest-specific route tree at all.

**Keep:** `/`, `/login`, `/onboard`, `/parents`, `/api/auth/*`. All already match the target
table's shape. `dev/practice-card-states.tsx` is a dev-only visual gallery, out of scope for this
table either way.

**Add / rename** (from `/app/*` to the flat target paths): `/app/` → `/home`, `/app/kanji/$char`
→ `/kanji/$char`, `/app/map` → `/map`, `/app/stamps` → `/stamps`, `/app/parent` → `/parent/*`.
`/app` (the layout/auth-gate route) is deleted as its own route once nothing is nested under an
`/app` prefix — its auth check moves to wherever mounts the authenticated routes directly.

**Not accounted for in `routing.md` §2's target table at all: `/app/catalog`, `/app/workshop`,
`/app/mistakes`.** These are real, currently-reachable routes with real shared components behind
them. The target table doesn't list where they land — under `/parent/*`, as their own top-level
routes, or dropped. This needs the architect's decision, not mine; I'm flagging it rather than
picking one, since guessing here would mean deleting or relocating three real features on an
assumption.

## V4 — Entry resolvers: CONFIRMED, with a fresh, concrete example

At least **five** separate places independently decide "does this user have an active child, and
if not, where do they go":

1. `routes/index.tsx` — the intended single top-level resolver (signed-in → `/app`; `hasRidden`
   → `GuestHome`; else → `EntranceDoor`). This one matches the target design.
2. `app/index.tsx` — its own children-fetch + resolve-active-child effect, **including this
   week's ruling-2 fix** (remembered child, station board only on first open/explicit switch).
3. `app/catalog.tsx` — its own copy of the same resolver pattern, **without** the ruling-2 fix.
4. `app/stamps.tsx` — same pattern, same gap.
5. `app/workshop.tsx` — same pattern, same gap.

`app/mistakes.tsx` and `app/parent.tsx` and `app/kanji.$char.tsx` don't redirect but do their own
`search.child || readActiveChildId() || ""` resolution independently, a sixth variant of the same
underlying decision.

**This is not hypothetical.** I checked `catalog.tsx`'s resolver directly against `index.tsx`'s:
`catalog.tsx` falls back to `childrenQ.data[0]` — the household's *first-ever-created* child —
with no station-board and no remembered-child check at all. A family with two children who taps
into `/app/catalog` from anywhere but the home screen will silently land on whichever child was
registered first, regardless of which child is actually active on the device right now. This is
a real, currently-shippable inconsistency, and it exists specifically *because* this week's
ruling-2 fix was applied once (to `index.tsx`) and not propagated to the other four places that
needed the same fix — which is exactly the failure mode `routing.md` describes in the abstract,
now caught in a specific, nameable spot.

## V5 — Orphans: partially confirmed

**Confirmed orphan:** `apps/web/src/components/departure-board.tsx` exports
`DepartureBoardView` — the old 発車標 screen. **It is imported nowhere in `apps/web/src`.**
`child-home.tsx` imports only the `DepartureBoard` *type* (the data shape), to feed the current
`DepartureTicket`/`TrainLine` UI — not the old view component. This is dead code, unreachable by
any route in the current tree.

**Not confirmed:** "the legacy parent door alongside the new 保護者 control" and "any legacy
shell." I found exactly one `ParentDoor` component, imported only by `child-home.tsx`, used
identically on both `/app` and `/demo`. I found exactly one of each shell (`app-shell`,
`child-shell`, `ride-shell`) — no duplicates. The visible 保護者 link and `ParentDoor`'s
long-press are both real, both intentional (per the existing `ux-ia.test.ts` assertion that
checks for both), and are two different affordances for the same destination, not a legacy/new
pair. This part of the diagnosis doesn't hold against the code as it stands today.

## V6 — What's actually deployed: confirmed clean, closes the escape hatch

```
$ grep -rl "乗車券\|きょうの でんしゃ" apps/web/src
apps/web/src/components/session-stub.tsx

$ git log --oneline origin/main -3
b3edd46 Merge pull request #34 ... diagnostic workflow only
84da600 Add a read-only Cloud Run revision diagnostic workflow
afcf60c Merge pull request #33 ... Dockerfile: build @kanji-densha/engine before the web app
```

The ticket-anchor work is on `main`. Separately, from this morning's own deploy investigation
(same session, `diagnose-cloud-run.yml`, run against the live service): the newest Cloud Run
revision (`dynamic-densha-web-00002-sim`, created today) runs an image digest
(`sha256:64db92b9...`) built by the same pipeline from commit `afcf60c` — i.e. from `main`, after
the ticket work landed. **The deployed image matches `main`.** This protocol does not stop here;
the gap this morning was a separate, already-fixed build issue (the Dockerfile never building
`@kanji-densha/engine`'s `dist/`), not evidence against anything in this diagnosis.

---

## Summary for the founder

- **V1 is confirmed by demonstration, not by argument.** Two independently-maintained,
  identically-named `evaluateProgress` functions produce different answers to "how close is this
  child to かんぺき" for the identical mistake. This alone justifies the engine-unification work
  regardless of how the rest of the diagnosis lands.
- **The fix for the guest side already exists, tested, unused:** `packages/store`'s `LocalStore`
  calls the real engine correctly. Wiring it in and deleting `demo-progress.ts`'s legacy scoring
  is much closer to "flip a switch" than "build new infrastructure."
- **The UI-duplication claim is overstated.** Components are properly shared; what's duplicated
  is per-route resolver *logic*, and V4 catches a real, live instance: this week's multi-profile
  fix only reached one of five places that needed it.
- **The "two shells / legacy parent door" claim doesn't hold.** One orphan was found
  (`DepartureBoardView`), not a second shell system.
- **Three routes (`catalog`, `workshop`, `mistakes`) aren't in the target route table** and need
  an explicit decision before the route-tree cutover, not an assumption.
- **The deploy is not the problem.** `main` and the running image agree.
