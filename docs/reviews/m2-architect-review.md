# M2 architect review — PR #3

Reviewed 2026-08-23. Verdict: two changes before merge, both small.

The gate is the right gate: the exit criteria were verified rather than asserted, the 学
honest-omission path and the 男→田+力 cross-reference worked on first run, and the
rejection-suite fixtures each assert a named error rather than mere failure — that choice is
what makes the suite worth having.

## Change 1 — 生's taught readings: swap なま for うまれる

セイ, いきる, なま were all taught; なま came out and うまれる went in. All three original
readings are legitimately elementary per the reference table, so this was pedagogy, not a
correctness fix:

- セイ is not merely the common on-reading — it is the reason 生 is a Grade-1 character at
  all. A six-year-old meets this character as 先生, then shortly after as 一年生. Kept.
- うまれる belongs to a first-grader's actual life: birthdays, a new baby, when someone was
  born. いきる is the more abstract sibling of the same idea and stayed too.
- なま was the odd one out, and the problem was semantic, not frequency. It means *raw* —
  uncooked food. Every other elementary reading of 生 lives in the field of *life*. Teaching a
  child both meanings at first encounter splits the character across two unrelated concepts
  before either is anchored.

Mechanical consequence: meaning items require semantic distractors. A character whose taught
set spans "life" and "raw" has no coherent gloss to write a meaning item against. なま is a
fine Grade-3 or Grade-4 addition once 生 is solid — the wrong second concept for a first ride.

Applied: `content/characters/1/生.yaml` — `nama_kun` removed, `umareru_kun` added, the
`namamono_1` (生もの) surface replaced with `umareru_1` (生まれる). No other record affected.

## Change 2 — the record generator must not be committed

Part 3 asked for twenty hand-authored records, driven from a generator script holding
per-character judgment. The content itself is per-character judgment (acceptable) — but the
generator cannot live in the repo: two sources of truth for content means the next edit to the
generator + regenerate silently destroys any hand edit made to the YAML in between. It is also
the content factory arriving early through the side door, which is exactly the boundary M2 was
drawing on purpose.

Status: the original generator was never committed (confirmed via `git ls-files` before this
review — it only ever existed under `/tmp`). The migration script used to apply Change 1 and
D19 (restructuring `taught_readings`) was likewise run from `/tmp` and not committed. The YAML
files under `content/characters/1/` are the content; no generator or migration tooling ships
in this repo.

## D19 — record the judgment

Twenty characters produced one judgment call worth reviewing (生). A thousand will produce a
thousand, and they will be invisible without a mechanism. Two schema changes:

1. `taught_readings` gains a required `rationale` — one line, in Japanese, saying why this
   subset. For 生: 「先生・一年生のセイと、子どもの生活にある うまれる・いきる。なまは意味の
   系統が違うため後の学年で。」 The cheapest possible defence against a corpus of unexplained
   choices.
2. Each character declares an **anchor** reading id: the taught reading that justifies its
   grade placement. `taught_readings.anchor` must be one of `taught_readings.entries[].id` —
   enforced structurally in the schema (a Zod `refine`), not left to the gate, because
   containment needs no data outside the record itself. A record teaching 生 without セイ as an
   entry is now rejected rather than merely looking odd. See
   `fixtures/bad-content/schema--anchor-not-in-taught-readings.yaml`.

`rationale` and `anchor` were added to all twenty existing records (via the `/tmp` migration
script) and to all sixteen `fixtures/bad-content/` records that carry `taught_readings` (with a
generic placeholder rationale and a valid anchor, since those fixtures test unrelated rules).

## Hardening

**Fixture-completeness check derived from the gate, not from filenames.** The prior check
(`test/bad-content.test.ts`) hand-typed the list of expected gate error codes; a new code added
to `gate.ts` without a matching entry in that hand-typed list — and without a fixture — would
pass the completeness check vacuously, because the check only verified that codes *it already
knew about* had fixtures. `gate.ts` now exports `GATE_ERROR_CODES` (a `const` array) and
`GateErrorCode` (the union derived from it); `GateError.code` is typed against that union, so a
typo or an unlisted code is a compile error. The completeness check imports `GATE_ERROR_CODES`
directly and iterates it, so it can no longer drift from the gate it is meant to be checking.
Demonstrated: temporarily adding a code to `GATE_ERROR_CODES` with no fixture fails the
completeness test; reverted after confirming the failure.

**NFC-normalisation testing codified in `CLAUDE.md` §5.** The editing tools used to write this
codebase normalise Japanese literals in flight, so a decomposed character pasted into source
becomes composed before it is ever saved — silently defeating a test meant to exercise NFC
normalisation. `CLAUDE.md` §5 now states the rule: build the decomposed string from explicit
code points (`String.fromCharCode(0x304b, 0x3099)`), never a literal, so the input a test starts
from is verifiably still decomposed.

**content-dist-drift gate fixed for non-ASCII paths.** Applying D19's migration to `content/`
surfaced an M0-era bug in `scripts/check-content-dist-drift.mjs`: git renders non-ASCII paths as
quoted octal escapes by default (`core.quotepath`), so every kanji filename in this repo was
silently invisible to the gate's `content/` prefix match — the gate could never have detected a
`content/` change, only ever `content-dist/` changes, which is exactly backwards for what it
exists to catch. Fixed by invoking git with `-c core.quotepath=false`. This had never fired
before M2 because M0/M1 touched no non-ASCII paths.

## Noted, no action

Relative imports in root-level tests (`test/*.test.ts`) instead of linked workspace packages.
Fine for now; M3 introduces `apps/web` importing `engine` and `store` for real, so workspace
resolution has to work properly then — fix as part of M3 setup, not as a retrofit here.

`teach_ready: 0/80`, twenty `audio_pending`, audio the sole unmet item per character. Exactly
D18. The architect's own framing: watching the gate correctly refuse twenty otherwise-complete
records is a better demonstration than any green number would have been.
