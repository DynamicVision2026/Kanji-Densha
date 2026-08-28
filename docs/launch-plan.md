# Launch plan — the shortest closed loop

Written 2026-08-26. Priority is stated as speed to market. This document says what the
critical path actually is, and what gets cut to protect it.

---

## The funnel, and the one fact that reshapes it

```
YouTube → landing page → app entrance → child rides → parent sees value → pays
```

**かんぺき takes eight days.** Two spaced echoes, 20h then ~168h — that is the product's core
promise and it cannot be demonstrated on day one, by design (MR-5.3). So the conversion moment
is **not** かんぺき. It is 到着 at だいたい, plus the honest sentence that the train comes back.

Build the funnel around that. A parent decides on day one; the proof arrives on day eight. The
save prompt at first 到着 exists precisely to bridge those eight days, which makes it the most
commercially important screen in the product, not a nicety.

## The biggest speed lever: don't launch with a grade

Grade 1 is 80 characters. Twenty exist. Sixty more records plus audio is weeks of content work
on the critical path — **and it is unnecessary.**

Trains are curated editorial lists, not fixed slices of the 配当表 (spec §3). So define the
first three or four trains from **the twenty records that already exist**, and launch with
those. Content leaves the critical path entirely.

That also hands you a natural commercial boundary: the first trains are free, the rest of
Grade 1 and beyond is paid. The free tier is a real, complete, honest experience — a child can
reach かんぺき on twenty characters — and the paywall sits where the child wants to keep going
rather than where the product stops working.

**Consequence:** the content factory is deferred again, and correctly. Build it when there are
paying families asking for Grade 2, not before.

## The actual critical path

In order. Everything not on this list is deferred.

1. **VOICEVOX pilot → native-speaker accent review.** *Blocks everything.* No audio means
   `teach_ready: 0` (I9/D18), which means no character can be honestly taught and the parent
   report shows a parent zero. Needs your Mac and a native speaker. **This is the long pole and
   it is not an engineering task.**
2. **Audio batch for the existing twenty** — roughly eighty files, one batch, once the pilot
   passes.
3. **Q16 reteach fix.** A ride that dead-ends on one wrong answer cannot be shipped to
   children. Small PR, already specified.
4. **Entrance + routing + 到着 save prompt.** All eighteen decisions are answered; this is
   implementation.
5. **Harvest auth wiring + deploy workflow.** Two PRs. Only these two.
6. **Parent report v1 — deliberately minimal.** Status counts, this week's activity, the
   ≤5-character paper list. Nothing else.
7. **Static landing page.** Separate repository, plain HTML or Astro, Japanese only. Not part
   of the app — marketing changes must never touch product code or its gates.

## Cut from the critical path

Not cancelled — **sequenced after launch.** These were all correctly judged worth harvesting;
they are simply not what stands between you and a live product.

| Deferred | Why it can wait |
|---|---|
| i18n catalogues (4 locales) | Launch is Japan, Japanese only. Non-native households are a real segment and a later one. |
| `parent-report.ts`, `weekly-plan.ts`, `route-map.tsx`, `stamps.ts` harvest | Parent report v1 is smaller than what these implement. Harvest them when v2 needs them. |
| The welcome screen's moving switchback | The entrance page is the launch surface. The full terraced animation is M5 and it is beautiful and it does not sell anything on day one. |
| Payments / Shopify | **Launch free.** The loop you need to validate is YouTube → landing → registration → return visit. Money is the slowest, riskiest piece — subscriptions, renewal, tax, cancellation — and it can be added once you know the loop converts. Charging is not the experiment; retention is. |
| Content factory, Grades 2–6 | Nothing on the free tier needs them. |
| Q14 教科書体 font | One CSS token, one line, any time. |

## What speed does not buy

The gates stay. Every one of them costs minutes per PR; the drift they prevent has already
cost this project a duplicated engine, a blind drift gate for three milestones, and a week of
consolidation. Moving fast is what the gates are *for* — they are the reason a change can be
merged without a day of manual verification.

Specifically, unchanged under time pressure: one engine, published-only content, honest
`teach_ready`, no runtime LLM on the child path, the child session before M3 closes, and a
native-speaker pass before any audio reaches a child. The last two are the only manual gates
left, and both protect claims made directly to parents.

## The three things only you can do

Everything else is implementable. These are not, and they are all upstream of launch:

1. **Install VOICEVOX and run the pilot.**
2. **Find the native Japanese reviewer.**
3. **Find the six-year-old.**

Three people-shaped dependencies, currently unarranged, sitting in front of everything else.
If one household covers the reviewer and the child, one visit unblocks two of them.
