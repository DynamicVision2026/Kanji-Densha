# Claude Code kickoff prompts — M0 and M1

Repo: `DynamicVision2026/Kanji-Densha` (empty as of 2026-08-23).

## Step 0 — before the first prompt

Do this by hand, not through Claude Code:

```bash
git clone https://github.com/DynamicVision2026/Kanji-Densha.git
cd Kanji-Densha
mkdir -p docs/spec docs/prompts
# copy in: CLAUDE.md, docs/architecture.md, docs/decisions.md, docs/build-plan.md,
#          docs/open-questions.md, docs/spec/mastery-rules.md,
#          docs/prompts/kickoff-m0-m1.md
# copy the product specification to docs/spec/product-spec.md
git add . && git commit -m "docs: product spec, architecture, build plan, invariants"
git push
```

The docs land first so that Claude Code's very first read of the repo is the constitution.
**Make the repository private before this push** (D12) — the corpus is the moat, and the
decision is free now and irreversible after the first fork.

---

## M0 prompt — skeleton and enforcement

> Read `CLAUDE.md`, then `docs/architecture.md`, `docs/decisions.md`,
> `docs/spec/mastery-rules.md`, `docs/build-plan.md`, `docs/open-questions.md`, and
> `docs/spec/product-spec.md` in full before writing anything.
>
> Implement **M0 only**. Branch `m0-skeleton`. No product logic, no UI, no content records.
>
> Scaffold a pnpm monorepo with the exact package layout in `architecture.md` §0:
> `packages/engine`, `packages/content-schema`, `packages/content-build`, `packages/store`,
> `apps/web`, plus top-level `content/` and `content-dist/`. Every package is TypeScript
> with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
> Vitest for tests. Create each package with a placeholder export and a passing smoke test —
> real implementations come in later milestones.
>
> Then build the enforcement layer, which is the actual point of this milestone:
>
> 1. ESLint flat config with `no-restricted-imports` boundary rules: `apps/web` cannot import
>    from `content/` or from `packages/content-build`; `packages/engine` cannot import from
>    any other workspace package or any external module.
> 2. `packages/engine/package.json` has an empty `dependencies` object, and a CI script
>    `scripts/check-engine-purity.mjs` that fails if `Date.`, `Date.now`, `Math.random`,
>    `fetch`, `process.`, or `require(` appear anywhere in `packages/engine/src`.
> 3. A CI script that fails if `content-dist/` has changed in a commit without a
>    corresponding change under `content/`.
> 4. GitHub Actions workflow running: install, typecheck, lint, engine-purity, test,
>    content-dist-drift. All must be blocking.
> 5. A PR template requiring three fields: milestone, exit criteria closed, and which
>    invariant this PR came closest to breaking.
> 6. `.gitignore`, and a short `README.md` stating what the product is, the five statuses,
>    the three lamps, and a pointer to `CLAUDE.md` for anyone (human or model) who opens the
>    repo cold.
>
> **Exit criteria — demonstrate, do not assert.** In the PR description, show the actual CI
> failure output for three deliberately broken states, each reverted before commit:
> an engine file calling `Date.now()`; `apps/web` importing from `content/`; a hand-edited
> `content-dist/` file. If a gate does not fail, the gate is broken, not the test.
>
> Do not start M1. If anything in the docs is ambiguous, append to
> `docs/open-questions.md` and ask me rather than choosing.

---

## M1 prompt — the engine

Run only after M0 is merged.

> Read `docs/spec/mastery-rules.md` in full — it is the normative implementation target and
> it governs the engine wherever it and the product spec appear to differ. Then
> `docs/decisions.md`, `docs/architecture.md` §1, and spec §11 for grade parameters.
> Implement **M1 only**. Branch `m1-engine`. No UI, no content beyond
> `content/params/grades.yaml`.
>
> Build `packages/engine` exactly to the contract in `architecture.md` §1: the domain types,
> the event union, `GradeParams`, and
> `evaluateProgress(previous, event, params, requiredLamps) → next`. Pure, total,
> deterministic, zero dependencies. Time arrives inside the event; never read a clock.
>
> `content/params/grades.yaml` must specify every field for all six grades explicitly.
> No inheritance, no defaults, no G1 values silently reused for G3–G6 — that is a named
> failure mode in spec §11.
>
> Every previously open rule is now decided and written into `mastery-rules.md`; there are
> no assumptions left to make and no `ASSUMED-*` fixtures. Note in particular two places
> where authority moved from the caller into the engine, superseding the original draft
> contract: novelty is derived from `seenSurfaces` / `novelFailures` rather than declared by
> the event (MR-1.2), and echo rounds are opened and closed by the engine via `openEcho`
> rather than reported by an `echo_result` event (MR-1.3, MR-6.1–6.2). If any clause turns
> out to be unimplementable or self-contradictory, stop and tell me which one and why —
> do not repair it in code.
>
> Tests:
> - `packages/engine/fixtures/*.json`, one per testable clause in `mastery-rules.md`, each
>   named after the clause it encodes (e.g. `MR-6.3-failed-echo-preserves-almostAt.json`).
>   Every MR clause from §3 through §7 must have at least one fixture; report any clause you
>   could not test and why.
> - property tests: no event stream with fewer than two successful echoes ever reaches
>   `perfect`; no stream sharing a single `sessionId` ever reaches `perfect`;
>   `soft: true` answers never increment `consecutiveWrong`; identical inputs always produce
>   identical outputs
> - one named integration fixture, `THE-JOURNEY`, that walks a single character from `new`
>   through a session to `almost`, advances the virtual clock past the first and second echo
>   delays in distinct sessions, and lands on `perfect` with exactly one stamp. Reference it
>   in the README.
> - a second integration fixture, `THE-SETBACK`, that fails the second echo, confirms the
>   character sits at `fix` with `almostAt` intact and no echo slot consumed, re-lights the
>   lamp in the next session, and reaches `perfect` without waiting another week (D2/MR-6.3).
>
> **Exit criteria:** 100% branch coverage on `evaluateProgress` specifically (not repo-wide),
> all fixtures passing, `pnpm lint` and the engine-purity gate clean, and a PR description
> listing every MR clause with the fixture that covers it.

---

## Notes for later milestones

Write the M2+ prompts the same way: name the milestone, forbid the next one, point at the
specific spec sections, and make the exit criterion something the model has to *show*
rather than claim. The two failure modes with an agentic implementer on a spec this
detailed are scope drift forward and silent resolution of ambiguity. Both are addressed by
the same discipline — one milestone per branch, and every unanswered question routed to
`docs/open-questions.md` instead of into the code.
