# Implementation brief — welcome screen

Paste into a fresh Claude Code session. **This is M5 work.** Do not start it before M3 has
been through a child session; the timing here is the architect's, not the implementer's.

---

> Read `docs/design/welcome-screen.md` in full — it is the design authority and it governs
> geometry, motion, and data contracts. Then `docs/decisions.md` (D20), `CLAUDE.md`, and
> `docs/spec/mastery-rules.md` §7. Branch `m5-welcome-screen`.
>
> Build `<KanjiTrain>` as a **data-driven CSS/SVG system with live text**. Not a Lottie file,
> not a Rive file, not a sprite sheet, not a video. Each kanji is a real SVG `<text>` node
> whose content comes from the child's progress, because a baked animation asset cannot carry
> live text and cannot lengthen when a child earns their thirty-first character.
>
> **Structure.** `<WelcomeScreen>` supplies cars; `<KanjiTrain>` renders and animates them and
> knows nothing about storage. One exported `toTrainCar(progress)` performs the five-to-three
> status collapse (spec §5) — the UI never re-derives status (I5). Rendering this screen,
> including any tap card, must emit **zero** progress events; enforce it with a test.
>
> **Geometry.** One SVG path, spec §1, sampled once at mount into a lookup table at 3-unit
> steps. `getPointAtLength` must never appear in the frame loop — a test or a comment should
> say so, because it is the one change that will silently destroy mobile performance later.
> Scale derives from y, never from index.
>
> **Motion.** Convoy indexed from the locomotive so appending never disturbs existing cars
> (spec §2, §4). Reset only when the tail has cleared `L + 40` (spec §3) — not on a timer,
> not when the locomotive exits. Speed from the formula in spec §7; `SPEED_MAX` is derived
> from the 1.24s readability floor and is not tunable upward.
>
> Implement motion with **CSS `offset-path` and per-car negative `animation-delay`** if you
> can hold the geometry exactly — the compositor drives it and JS runs zero frames. Otherwise
> a `requestAnimationFrame` loop writing one transform per car is acceptable and is what the
> approved prototype does. Measure both on a real phone before choosing, and put the numbers
> in the PR.
>
> **Legs and summits** (spec §9): route holds `LEG_MAX = 36`; completed legs render as 合目
> markers on the ridge, completed grades as summits. Do not skip this as a later enhancement —
> without it the component is untestable above 36 cars, which is most of a real child's life
> in the product.
>
> **`pendingAttachments`** (spec §4): cars earned since `lastHomeSeenAt` play their arrival on
> mount, in sequence, then the timestamp advances. This is the single most rewarding moment in
> the product and it happens while the child is elsewhere; if you skip the queue, they never
> see it.
>
> **Reduced motion** (spec §8): same layout function, frozen, full convoy distributed across
> the route. Not a blank state.
>
> **Tests:** zero cars; one car; 36 cars; 37+ cars (leg boundary); a newly attached car
> preserving all existing positions; a car regressing from `perfect` to `fix` staying attached
> (D20); reduced-motion; 360px viewport; and the read-only assertion above.
>
> **Exit criteria.** Sustained 60fps at 36 cars on a real phone, measured and reported, not
> asserted. Every kanji on the near terrace legible in a screenshot at 360px. And the primary
> CTA reachable in one tap at any point in the loop — a child who opens the app wanting to
> learn must never wait for an animation.
>
> Present the visual direction as a running prototype before the PR, per the staged rule.
