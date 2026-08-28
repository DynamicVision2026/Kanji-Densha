# Repo consolidation — audit request and direction

Two repositories exist: `DynamicVision2026/Kanji-Densha` and `DynamicVision2026/Dynamic-Densha`.
They must become one. This document says what to find out before deciding how.

---

## Provisional direction

**`Kanji-Densha` is the trunk. `Dynamic-Densha`'s work merges into it.**

Not because it is bigger, but because of what is cheap and what is expensive to reproduce:

| Asset | Where | Cost to rebuild |
|---|---|---|
| Hash-verified MEXT reference table, ingested with provenance | Kanji-Densha | Very high — it depends on a hand-verified conversion and a blocked-egress source |
| `evaluateProgress`, 100% branch coverage, fixtures named per MR clause | Kanji-Densha | High — the rules took a day to lock and the fixtures encode them |
| Content schema, gate, rejection suite, twenty authored records | Kanji-Densha | High |
| CI gates: purity, boundary lint, drift — plus the two bugs already found in them | Kanji-Densha | High, and partly invisible: the gates look fine until they aren't |
| The constitution, decisions register, mastery rules, design docs | Kanji-Densha | High |
| Welcome UI, entrance page, Cloud Run preview | Dynamic-Densha | **Low** — this is a week of work against specs that already exist |

UI is the re-implementable half. A validated 1,026-row authority and a proven state machine
are not. Moving the gates to the UI repo means re-proving them; moving UI into the gated repo
means it simply becomes governed on arrival.

This is provisional because the audit may show `Dynamic-Densha` holds something that only
exists there — a working deploy pipeline, auth configuration, an app scaffold that took real
effort. Those get carried across; they do not change which repo is the trunk.

---

## Audit — do this before any merge

Read both repositories and report. **Change nothing.** This is an inventory, not a migration.

1. **Does `Dynamic-Densha` contain any second implementation of the mastery or status model?**
   Anything that computes、stores、or names a status — five colours, `perfect`/`almost`,
   かんぺき logic, echo timing, lamp state. **This is the question that matters most.** A
   second status algorithm across two repos is invariant I5 violated at a scale no lint rule
   can catch, and if it exists it is the first thing to delete rather than merge.

2. **What exists only in `Dynamic-Densha`?** Deploy pipeline and Cloud Run config, auth setup,
   app scaffold, routing, i18n catalogues, design tokens, the welcome/entrance components,
   anything else. For each: is it ahead of, behind, or absent from `Kanji-Densha`?

3. **What exists in both and has diverged?** Terminology, the five status words, grade data,
   character records, copy strings, colour tokens. List every divergence with which version is
   correct per `docs/decisions.md`.

4. **Does `Dynamic-Densha` have any of the gates?** Purity check, boundary lint, drift gate,
   coverage gate, PR template. If it has been shipping to a live preview URL with none of
   them, say so plainly — that is the finding that decides how urgent this is.

5. **Git shape.** Branch count, open PRs, whether histories share any commits, roughly how
   many files and lines are unique to `Dynamic-Densha`.

6. **Any secrets, keys, or service-account credentials** committed or referenced in either
   repo. If the Cloud Run deploy is configured, something is authenticating.

Report as a table plus a short recommendation. Do not open a PR, do not move files, do not
start the merge. I will write the consolidation plan from the inventory.

---

## Decision criteria, stated in advance

So the plan is not argued after the fact:

- The trunk is whichever repo holds the engine, the content gate, and the reference authority.
  On present information that is `Kanji-Densha`.
- Anything merged in arrives **under the constitution** — no carve-outs, no "the UI repo did it
  differently." If UI code violates a boundary rule, the UI code changes.
- A second implementation of the mastery model is deleted, not reconciled. One engine.
- Deploy configuration, auth, and i18n come across as-is if they work; they are plumbing and
  carry no design authority.
- Nothing ships to a public preview URL from an ungated repo once the merge is done.
