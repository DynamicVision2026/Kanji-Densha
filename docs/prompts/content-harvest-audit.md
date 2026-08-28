# Brief — content and audio harvest from Dynamic-Densha

The founder reports that complete material for all 1,026 characters — records, readings,
stroke data, and generated audio — exists in `Dynamic-Densha`, most likely under `artifacts/`
and `public/`, which the security-focused audit did not open. If so, this removes the largest
item from the launch critical path.

**Governing principle: the content is a candidate, the gate is the judge.** It was authored
under the divergent engine by an agent that never had the MEXT reference table as an
authority. Do not weaken any gate rule, schema constraint, or invariant to admit it. If three
hundred characters fail, that is information, not a blocker — report the number and the
reasons.

---

## Paste this

> Read `docs/reviews/repo-harvest-plan.md` and `docs/reference/README.md` first. Clone
> `Dynamic-Densha` read-only outside this repo. Branch `content-harvest-audit`. **Phase 1 is
> inventory only — import nothing yet.**
>
> **1 — Find and inventory the payload.** Look under `artifacts/`, `public/`, `src/data`,
> `migrations/`, and anywhere else records or audio live. Report: how many characters have
> records, how many have audio, how many have stroke data, the file formats, the total size,
> and the on-disk shape. Show one complete example record verbatim so I can see the schema it
> was written against.
>
> **2 — Audio provenance. This one has a decision attached.** Determine which engine generated
> the audio. The i18n catalogue still claims xAI TTS, which D16 withdrew in favour of VOICEVOX
> Nemo. Report the engine, the voice, whether any manifest or generation parameters were kept,
> the file count and naming scheme, and whether one consistent voice was used across all 1,026.
> **Do not regenerate anything.** A single consistent voice matters more to a child than which
> vendor produced it, and mixed voices across characters would be the actual defect.
>
> **3 — Run the gate against it, unmodified.** Write a conversion from their record shape into
> our `content/characters/` schema and run `pnpm content:build`. Report:
> - how many of 1,026 pass
> - failures grouped by gate rule, with counts — reading not resolving against
>   `onkun-stage.json`, item lighting more than one lamp, missing anchor reading, ungated shape
>   data, missing audio, echo capability absent, and so on
> - the ten most common individual failures with examples
>
> Convert into the schema; do not adjust the schema to fit the data. Where their record carries
> something our schema has no field for, list it rather than inventing a field.
>
> **4 — Spot-check ten characters by hand** against `onkun-stage.json`, including 生, 川, 目,
> 火 and 学 (the ones we already know are traps). Report whether their taught readings are
> elementary-stage, whether any middle-school reading is being taught, and whether the shape
> data is primitive/compound-correct.
>
> **Report and stop.** No import PR, no schema changes, no gate changes. I will decide the
> triage strategy from the pass rate.

---

## Decisions waiting on the report

- **Pass rate above ~90%** → import the passing set, launch with Grade 1 complete, triage the
  remainder as ordinary content work after launch.
- **Pass rate 50–90%** → import Grade 1 only, fix the Grade 1 failures by hand, defer the rest.
- **Below 50%** → the records were built to a different specification and the twenty
  hand-authored ones plus the free-tier plan from `docs/launch-plan.md` stand.

## Licensing — the founder has cleared usage; the remaining task is display

Commercial clearance for fonts and VOICEVOX audio is confirmed on the founder's side and is
not to be relitigated. What remains is an engineering obligation, not a legal one:

**The parent-facing credits page must carry the required attributions**, and the licence
register must record what was used. At minimum the `VOICEVOX:Nemo` token verbatim, the font
attribution, and KanjiVG credit if the stroke data derives from it. Record in
`docs/licenses.md` what each asset actually derives from — not to reopen the question, but so
that a future engine upgrade or asset swap knows what it is replacing.

## What this does not clear

Licensing is cleared. **Pitch accent is not.** Nobody has checked whether 1,026 characters of
generated audio say the words correctly, and that is a separate gate from the legal one
(`docs/licenses.md`, D16). Four thousand files cannot be reviewed by hand, so:

- **Full review of the launch set** — every file for the characters shipping first.
- **Sampled review beyond it** — twenty files per grade, and if a grade's sample fails, that
  grade's audio is reviewed in full or regenerated before it ships.

A child hearing やま with the wrong accent is being taught an error confidently, by the one
product feature that paper cannot provide. That check stays.
