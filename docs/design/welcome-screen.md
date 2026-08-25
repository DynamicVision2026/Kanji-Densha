# Welcome screen — design specification
Status: **direction approved 2026-08-24.** This document is the design authority for the
welcome screen. It governs geometry, motion, and data contracts. Where it and a prototype
disagree, this document wins.
The screen has two jobs: explain the product to a child who has never seen it, and be the
living record of what that child has earned. Same visual system, two data sources.
---
## 1. Route geometry and car spacing
The route is **one SVG path**, not a set of positioned elements. Everything else derives from
it, so changing the landscape means editing one `d` string.
Reference viewBox `0 0 360 470` (mobile-first; the path scales with the viewport).
```
M -80 412  L 344 412  C 374 412 374 346 344 346
           L  16 346  C -14 346 -14 288  16 288
           L 344 288  C 370 288 370 238 344 238
           L  16 238  C  -8 238  -8 196  16 196
           L 210 196  L 430 174
```
Five terraces at y = 412, 346, 288, 238, 196, alternating direction, joined by switchback
curves at the ends. The path deliberately begins off-screen left (`x = -80`) and ends
off-screen right (`x = 430`) — those runoffs are what make entry and exit continuous rather
than pop-in. Path length ≈ **1,700 units**.
| Constant | Value | Why |
|---|---|---|
| `CAR_W` | 52 | 30px kanji at scale 1.0 — the readability floor on a 360px screen |
| `CAR_H` | 45 | |
| `GAP` | 54 | Car width plus a 2-unit coupling gap; cars read as a coupled train, not a queue |
| `SCALE_NEAR` | 1.00 | At y = 412 |
| `SCALE_FAR` | 0.30 | At y ≤ 196; below this a kanji is texture, which is intended for the top terraces |
**Sampling.** The path is sampled **once at mount** into a lookup table at 3-unit steps
(~570 entries). `getPointAtLength` is expensive and must never appear in the frame loop.
**Scale is a function of y, not of index:** `scale = clamp((y − 168) / 244 × 0.78 + 0.28,
0.30, 1.00)`. Derive it from position so a route change can't desynchronise the perspective.
## 2. Ordering rule — newest nearest
**The convoy is indexed from the locomotive.** Car *i* sits at `head − i × GAP`, where `i = 0`
is the locomotive. Earned cars fill `i = 1 … n` with the **oldest adjacent to the locomotive**
and the **newest at the tail**.
Consequence, and it is the point: the most recently earned kanji is always the nearest and
largest car on the route. Recency and readability align without any special case. A child
looking for what they just learned looks at the bottom of the screen.
## 3. Loop and reset contract
`head` advances by `speed × dt`. A car is rendered only while `0 ≤ d ≤ L`.
**Reset fires only when `head − (n+1) × GAP > L + 40`** — that is, when the tail has cleared
the far end and *every* car is off-path. The reset is therefore unobservable rather than
merely quick. Resetting on a timer, or when the locomotive exits, is wrong and will show a
visible jump.
Cars fade over the final 70 units (`opacity = (L − d) / 70`) so departure reads as distance
into the mist, not deletion.
## 4. `pendingAttachments` and coupling
かんぺき is granted during a 残響 session, while the child is looking at 到着 — **not** while
they are on this screen. If home simply renders the new state, the most rewarding moment in
the product happens off-screen and is never seen.
So home maintains a queue:
```ts
pendingAttachments = perfectCharacters
  .filter(c => c.stampedAt > lastHomeSeenAt)
  .sort((a, b) => a.stampedAt - b.stampedAt);
```
On mount, each pending car plays its arrival at the tail — appearing at the near start,
coupling, and settling — then `lastHomeSeenAt` advances. Multiple pending cars play in
sequence, not simultaneously.
**Coupling must not disturb the train.** Because the convoy is indexed from the locomotive,
appending to the earned array leaves every existing car's offset untouched. This is a
structural property of the indexing, not an animation trick — preserve it.
## 5. Data contract
The screen **reads** progress and never writes it. Rendering it, including any card, emits
zero progress events.
```ts
type TrainCar = {
  kanji: string;
  presentation: 'attached' | 'waiting' | 'future';
  earnedAt: number | null;
};
toTrainCar(progress: CharacterProgress): TrainCar
```
One exported mapping function, one place, collapsing the engine's five statuses:
```
perfect            → attached   (green car on the route)
almost             → waiting    (not on the main route in v1)
new | fix | lost   → future     (not shown here at all)
```
The UI never re-derives status (I5). Collapsing なおし and まよい to `future` is deliberate:
the home screen is not where a six-year-old meets the word for *lost*. The consequence must be
accepted knowingly — **repair work is invisible here**, which makes the recommended-station
CTA load-bearing rather than decorative. Repair is surfaced there and on the timetable.
The demo state uses a static fixture, never the child's data. **Demo cars are visually
distinct** — dashed border, paler green. A demo car that looks identical to an earned one
counterfeits かんぺき at first contact, which is the one signal this product sells.
## 6. D20 — cars are never removed
Once attached, always attached. A character regressing from かんぺき to なおし leaves the
train intact. Same logic as the write-once stamp: a shrinking train punishes a child with an
animation, which is precisely the dynamic this screen otherwise refuses. Regression surfaces
on the timetable and in the parent's attention list, where it can be acted on.
## 7. Speed scaling and loop duration
Two constraints pull against each other: the loop should complete in a watchable time, and a
near-terrace car must stay readable as it passes.
```
speed = clamp((L + (n + 1) × GAP) / T_TARGET, SPEED_MIN, SPEED_MAX)
T_TARGET  = 80s
SPEED_MIN = 24 units/s
SPEED_MAX = 42 units/s
```
`SPEED_MAX` is derived, not chosen: near-terrace dwell time is `CAR_W / speed`, and at 42 that
is **1.24s** — the floor for a six-year-old to recognise a kanji in passing. Raising it buys
shorter loops by making the product unreadable, so it is a hard ceiling.
Resulting loop times: 4 cars ≈ 74s, 12 ≈ 78s, 30 ≈ 87s, 36 ≈ 87s.
## 8. Reduced motion
`prefers-reduced-motion: reduce` freezes `head` and distributes the **full convoy across the
whole route** using the same layout function. The train is entirely visible and readable;
nothing is hidden and nothing moves. A manual pause control is also available and does the
same thing.
This is not a degraded state. For some children it may be the better one, and it should be
reviewed as a design in its own right, not as a fallback.
## 9. The grade mountain — how 100 or 200 cars are handled
**A grade is a mountain. A mountain is climbed in 合目.**
The route holds at most **`LEG_MAX = 36` earned cars**. That is not an arbitrary cap: at 36
the loop is 87 seconds at the readability-limited speed, and both numbers degrade badly above
it. A grade's earned characters are divided into legs of `LEG_MAX`:
| Grade | Characters | Legs |
|---|---|---|
| 1 | 80 | 3 |
| 2 | 160 | 5 |
| 3 | 200 | 6 |
| 4 | 202 | 6 |
| 5 | 193 | 6 |
| 6 | 191 | 6 |
- **The route shows the current leg** — the most recent up-to-36 earned cars of the current
  grade, moving, readable, complete.
- **Completed legs become 合目 markers** on the ridge behind: small cairns or stone posts, one
  per completed leg, with the count. 「三合目」 is a real Japanese mountain idiom a child meets
  in picture books, and it means *you are partway up*, never *you are behind*.
- **Completed grades become summits** — a marked peak in the far landscape, one per grade,
  permanent. 一年生の山 climbed.
- **The full cross-grade record lives in the stamp book**, which is the right home for
  1,026 items and the wrong job for a hero animation.
Without this, Grade 1 alone arrives as a four-minute freight train with no landscape visible
between cars. With it, every visible car is legible at every point in a child's six years in
the product, and finishing a leg becomes a genuine milestone that is not confetti.
## 10. Screen hierarchy
In descending visual weight:
1. **The train** — the upper ~70% of the screen. Progress made visible, and for a new user,
   the explanation of what the product does. It is not primarily a set of tap targets.
2. **つぎの駅へ** — the primary action, pinned below the scene, vermilion, always reachable
   without scrolling. The train must never delay or obstruct it: a child who opens the app
   wanting to learn can leave for the station in one tap, mid-animation.
3. **Stamp book** — secondary, an icon beside the CTA. Where the complete record lives.
No count, no percentage, no streak anywhere on this screen. The train *is* the number, legible
to a child who cannot yet read 「三十二だい」. Numerals belong in the parent view, where
counting is the point.
Prohibited here, permanently: rankings, comparison to other children, confetti, timers,
anything red-and-negative, and any language implying the child is behind.
