# Gate audit — representative (non-ASCII) data

Triggered 2026-08-24, after the M2 review found `scripts/check-content-dist-drift.mjs`
blind to every `content/` change since M0: git octal-escapes non-ASCII filenames by
default, and the gate's `content/` prefix match silently never matched a single one of
them until M2's kanji filenames exposed it. The M0 demonstration for that gate was real
and passed — it was proven with an ASCII filename, and this product does not have ASCII
filenames. The demonstration was real; the data wasn't.

New rule, `CLAUDE.md` §5: enforcement gates and tooling must be demonstrated against
representative data — kanji filenames, kanji content, non-ASCII paths — never ASCII
stand-ins.

This document is the audit of every other M0 enforcement mechanism against that rule,
done before M3 rather than discovered mid-milestone.

## content-dist-drift gate

**Already fixed once, in the M2 PR** (`-c core.quotepath=false`) — and a second, unrelated
bug in the same script surfaced while re-verifying that fix, worth recording exactly
because it wasn't the thing being looked for.

Re-running the gate locally right after merging and syncing M2 (`HEAD == origin/main`,
genuinely zero diff) produced `2 dist change(s), source changed` — not the `0/0` a clean
tree should report. The cause: `git()` returned `''` both when a `git diff` command
**failed** to resolve (unknown ref) and when it **succeeded with a legitimately empty
result** (no diff — the normal state right after any merge, and the state of every
push-to-main CI run, since `origin/main` at that point IS the pushed commit). The
progressive-fallback loop treated both as "this range didn't work, try the next," so a
correct empty diff at `origin/main...HEAD` was discarded and the loop fell through to
`HEAD~1 HEAD` — comparing against the wrong base and reporting the *previous* commit's
entire file list as "currently changed."

This is the same underlying disease as the non-ASCII bug, not a coincidence: the gate had
only ever been exercised in states where a real, non-empty diff existed (an active PR
branch against its base). The "nothing has changed" case — arguably the *most* common
real-world invocation, since it's what every push-to-main CI run and every fresh local
sync look like — had never been demonstrated. A gate proven only where there's something
to find is exactly as unproven as one proven only on ASCII.

Fixed: `git()` now returns `null` on a failed invocation and distinguishes that from a
real empty string; the fallback loop checks `out !== null`. Verified against three states
directly:

```
HEAD == origin/main, no changes           → 0 dist changes, source unchanged (correct — was 2/changed)
DRIFT_BASE pointed at a nonexistent ref   → falls back to HEAD~1..HEAD correctly
HEAD == origin/main, content-dist hand-edited → still correctly FAILS, naming the file
```

Practical impact assessed before fixing: the primary enforcement point (a PR's own CI
check against its base) was never at risk, because a real PR branch always has a non-empty
diff vs its base — the fallback bug only ever engaged in the "nothing to check" state,
where it happened to fall back to checking the last commit instead of doing nothing, which
could not by itself let a violation through unnoticed on the actual gating check. Fixed
anyway, because "happened not to be exploitable yet" is not the same as correct, and the
confusing/wrong local output is itself a cost.

## Boundary lint — `apps/web` must not import `content/`

**Suspected gap, checked, none found.** The ESLint `no-restricted-imports` patterns use
single-segment globs (e.g. `content/*`) which could plausibly fail to match a deeply
nested, real content path. Tested directly rather than assumed:

```
appended: import '../../../content/characters/1/山';
pnpm lint →
  '../../../content/characters/1/山' import is restricted from being used by a pattern.
```

Caught correctly — real kanji filename, three segments deep. ESLint's pattern matching
here is not a strict single-segment minimatch; the existing rule is sound. Reverted after
the test; no code change needed.

## Engine purity gate — forbidden-token grep

**Checked, none found, by both reasoning and re-demonstration.** The engine never
branches on kanji content (`characterId` is an opaque, uncompared-by-content string), so
there is no code path where non-ASCII data could change the grep's behavior — the search
is a plain substring match over UTF-8-decoded file content, which is encoding-agnostic for
an ASCII token regardless of what non-ASCII text surrounds it. Re-demonstrated directly
against the real `evaluate.ts` with the forbidden call wrapped in a Japanese comment:

```
appended:
  // 一時的なテスト: 日本語のコメントの中に Date.now() が隠れていても検出されるか
  export const DEMO_PURITY_CHECK = Date.now();
pnpm check:engine-purity →
  ✗ forbidden token "Date.now" / "Date." at both the comment line and the call line
```

Caught correctly, at both locations. Reverted after the test.

## Coverage gate — 100% branch on `evaluateProgress`

**Checked, already representative by default.** `packages/engine/src/fixtures.test.ts`
defaults every fixture's `characterId` to `'山'` (`fx.characterId ?? '山'`) unless a
fixture overrides it — real kanji, not an ASCII placeholder, has been the default
character identity running through all 35+ MR-clause fixtures and the property tests
since M1. No change needed.

## Conclusion

The content-dist-drift gate had two independent bugs, both found by actually re-running
it against states it had never been exercised in (non-ASCII paths in M2; a genuinely clean
`HEAD == origin/main` tree in this audit) rather than by inspection. Both are fixed. The
other three M0 enforcement mechanisms were re-demonstrated or reasoned through against
representative data and hold. The `CLAUDE.md` §5 rule is the lasting artifact — the next
gate added gets checked against real data, including the boring "nothing changed" case,
from its first demonstration, not retrofitted milestones later.
