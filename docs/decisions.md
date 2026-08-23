# Decisions

Locked 2026-08-23 by the architect. Each entry was a spec ambiguity; each is now a rule.
To reverse one, edit this file, then the affected clauses in `docs/spec/mastery-rules.md`,
then the fixtures named after those clauses. Never reverse one in code alone.

| ID | Decision | Rule |
|----|----------|------|
| **D1** | The second 残響 is measured **from `almostAt`** (≈168h), with a floor of 48h after the first successful echo. | MR-5.3 |
| **D2** | A failed echo repairs the failed lamp and drops to なおし, **preserving `almostAt`**. It does not consume an echo slot and does not restart the week. | MR-6.3 |
| **D3** | まよい forces わかる again, clears `almostAt` and echo history, and keeps the stamp. Recovery path is まよい → なおし → だいたい. | MR-3.2, MR-4.5 |
| **D4** | `shape_required` is purely derived from `shape.published`. A character can always reach だいたい on the lamps it actually has. | MR-2.2 |
| **D5** | A repair is clearable in the same session by one correct answer on any surface. | MR-4.7 |
| **D6** | An echo requires both the time delay and a `sessionId` distinct from the almost-granting session and all prior echoes. | MR-5.4 |
| **D7** | One stamp per character, ever. `stampedAt` is write-once and survives every regression. | MR-7.6 |
| **D8** | No decay in v1. Status never changes from the passage of time alone. | MR-7.8 |
| **D9** | Soft items (似た駅名 and kin) can **repair** a lamp but never **light** one, and never count toward まよい. | MR-4.2, MR-4.3 |
| **D10** | Greenfield build. The repository is empty; M2 hand-authors 20 characters before the content factory is written. | build-plan M2 |
| **D12** | The repository goes **private** before the first content commit. The corpus is the moat. | — |

Two engine-contract changes follow from D2 and D5, and supersede the original draft in
`architecture.md` §1:

- **Novelty is derived, not declared.** The `novelSurface` flag is removed from the event.
  The engine decides from `seenSurfaces` and `novelFailures` whether the U2 exemption
  applies, so a caller cannot claim an exemption it has not earned (MR-1.2).
- **The engine owns echo rounds.** There is no `echo_result` event. `openEcho` accumulates
  per-lamp results and the engine decides when a round closed and whether it passed, so the
  UI cannot report an outcome the answers do not support (MR-1.3, MR-6.1–6.2).

Both changes move authority from the caller to the pure function. That is the direction
authority should always move in this codebase.

**Still open:** D11 (kanji display font and its web-embedding licence) — see
`docs/open-questions.md`. It blocks the M3 visual identity lock, nothing earlier.
