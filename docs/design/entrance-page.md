# Entrance page — design specification

Status: **for approval 2026-08-28.** Design authority for `/`. Consolidates the eighteen
decisions answered in review, so they survive without the conversation.

The entrance page answers three questions for a parent in five seconds: what is this, is it
for my child, and what do I do next. It is not the child's home — that is M5, specified in
`welcome-screen.md`.

---

## 1. Routing

**A six-year-old never types a URL.** The first visit is always a parent; the returning visit
is always the child. So one URL, two renders, decided by state.

| Condition | `/` renders |
|---|---|
| Logged in | redirect to `/app` |
| `hasRidden` flag absent | **door page** (this document) |
| `hasRidden` flag present | **child home**, no marketing content |

**`hasRidden` is a dedicated flag**, set the first time a child actually rides — not the
seeded demo greens, which every visitor has on first load and which would send everyone
straight past the door.

`/` re-renders rather than redirecting: the child's bookmark and home-screen icon stay at the
root, and a redirect chain is one more thing to break.

**Parent return path.** A labelled `保護者` control, visible, top-right of the child home.
Not hold-only — a 1.5s hold is undiscoverable for a parent who has never used the product.
Keep the hold as an additional path.

## 2. Layout — three breakpoints, all defined

Nothing is left to reflow. The layout must not break or crowd at any intermediate width.

| Breakpoint | Layout | Scene | Type |
|---|---|---|---|
| **< 768px** — mobile | Single column | Between lead and doors, ~250px, fixed aspect | h1 29px, lead 14px |
| **768–1024px** — tablet | **Single column**, not two | ~430px, capped at 60% viewport height | h1 40px, lead 17px |
| **> 1024px** — desktop | Two columns, copy+doors left (~46%), scene right | Full column height, ~560px | h1 46px, lead 17px |

**Tablet is one column deliberately.** Two columns at 834px yields a ~400px text block beside a
squashed scene. One column also keeps the doors full-width and thumb-reachable on a held iPad,
which is plausibly the most common device for this product.

**Doors are never overlaid on the scene** at any width — an overlay makes them compete with a
moving object for the same attention.

**Scene geometry.** The SVG keeps a fixed `viewBox` and aspect ratio at every width; the
container height changes, the drawing never stretches. Use Flexbox for the column split and
Grid inside the door group. Test at 767, 768, 1023, and 1024 exactly — the boundaries are where
this breaks.

**Order on mobile and tablet:** eyebrow, headline, lead, scene, primary door, caption, two
secondary doors side by side, trust lines.

**Removed from this page:** `つぎの駅へ`, `でんしゃに のる`, `保護者ではじめる`, and any
counter. See §4.

## 3. Copy (Japanese only this release)

- **Eyebrow:** `KANJI-KUSOU ・ 文部科学省 1026字`
- **Headline:** `1026字を、列車に乗せて。`
- **Lead:** `おぼえた漢字が、一両ずつ 列車になります。` / `小学校で習う1026字を、6年かけて ゆっくり。`
  Replaces the previous 「暗記ではなく、景色として漢字を残す」 lead — a lovely sentence, and
  the wrong one for a parent scanning in five seconds.
- **Primary door:** `さわってみる`, caption beneath: `登録はいりません・1分でためせます`
- **Secondary doors:** `保護者の方へ` / `ログイン`
- **Trust lines**, directly under the doors: `専用タブレットは いりません` /
  `お子さまに 料金の画面は 出ません`

Trust lines sit under the doors because they answer the objection the doors just raised. Both
are literally true; the first is the real structural difference from a category leader that
charges ~¥10,000 for a tablet and penalises early withdrawal.

## 4. The demo train — visual parameters

The scene is **decorative and generic**. Its only job is to show that learned kanji become
green cars.

**No counter on this page.** A counter is a *record*, and there is no record yet. 「4りょう」
belongs on the child's home only, and `4/1026` appears nowhere ever — a fraction with a
thousand-character denominator reads as 99.6% incomplete on a child's first day.

**Data source: a static fixture array**, never progress. Four cars is enough to read the idea.

**Demo cars must be unmistakably not-earned.** A visitor shown cars identical to earned ones
is being shown a record that does not exist, and かんぺき is the one signal this product sells.

| Token | Earned (M5 home) | Demo (this page) |
|---|---|---|
| Body fill | `#B7CDA0` | `#CBD9BC` — one step paler |
| Border | `#8FA97A`, solid, 1.2px | `#8FA97A`, **dashed** `4 3`, 1.2px |
| Glyph ink | `#1C2B1E` | `#3C5233` — softer |
| Stamp dot | present on first perfect | **never** |

Dashed border is the primary signal and survives greyscale and colour-blindness; paleness is
secondary. Never colour alone.

**Motion — the full switchback animation ships here.** Founder decision, 2026-08-28: the train
climbing the terraced route is the primary hook for a parent's first five seconds and stays on
the entrance page.

Implementation is the approved prototype: one SVG path sampled **once at mount** into a lookup
table at 3-unit steps, cars positioned at `head − i × GAP` along it, scale derived from y, one
transform write per car per frame. `getPointAtLength` must never appear in the frame loop.
Speed ~30 units/s, `GAP` 54. Reset only when the tail has cleared `L + 40`, so it is
unobservable rather than merely quick.

**The child's home (M5) uses the same component with real data**, per `welcome-screen.md`. The
difference between the two screens is the data source and the car styling below — never the
motion.

**Kanji ink is dark on pale green**, not white on green — dark reads as brush on paper and
carries far more contrast at small sizes, which is the entire legibility budget.

**The dashed border means one thing across the entire product: "not yet real."** Demo cars
here, はじめて on the practice card (`practice-card-states.md`). A child learns that grammar
once and it holds everywhere. Do not use dashes for anything else.

**Rendering rules carried from `welcome-screen.md`:** kanji are real text nodes, never paths.
Hairpin radius ≥ 60px so cars cannot collide at the turn. `prefers-reduced-motion` freezes the
scene with the full train distributed along the route and visible — not a blank state.

## 5. Door destinations

| Door | Destination | Purpose |
|---|---|---|
| `さわってみる` | `/demo/kanji/一` | Straight into a ride, guest, localStorage. **一**, not 山 — Grade 1's first train is 一右雨円王, and 一 is one stroke, the fastest honest path to 到着. |
| `保護者の方へ` | `/parents` (new) | Pre-decision: what this is, is it safe, what will it cost. No account. |
| `ログイン` | `/login` | Returning account holder. |

Two parent doors are deliberate and not duplication: one is for a visitor deciding, one is for
a customer returning.

**`/parents` outline** — what it is in two sentences; the four beats in plain Japanese
(であう・わかる・ためす・とうちゃく); why かんぺき takes days rather than one sitting; what the
parent sees; privacy and child-data boundaries; 専用タブレット不要 and no price screens for
children; CTA back to `さわってみる`. **No pricing this release** — launch is free.

## 6. The save prompt at 到着

The commercially decisive screen, because かんぺき is eight days away and a parent decides on
day one.

- **Trigger:** the first time a guest reaches 到着 at **だいたい**. Not かんぺき — that is
  eight days out, and a guest could lose a week before we ever offer to keep it.
- **Placement:** **above** `つぎへ`, which remains. Not a modal, not a replacement.
- **Headline:** `つづきを ほぞんしますか`
- **Reason:** `この でんしゃは、2〜3日あとに もういちど もどってきます。ほぞんしておくと、そのとき つづきから のれます。`
- **Confirm:** `ほぞんする` **Decline:** `あとで`
- **If declined:** stay guest, ask again **once per session**. Never-again loses people still
  browsing; every-到着 is nagging.

Declining must cost nothing. No paywall, no hard gate, no degraded ride.

## 7. Prohibited on this page, permanently

Prices, payment, rankings, comparison to other children, streaks, timers, confetti, percentage
complete, any fraction with 1026 as a denominator, and any language implying a child is behind.

## 8. States to build and review

Demo (default) · zero-progress registered child · several earned cars · new car attaching ·
reduced-motion · 360px mobile · desktop two-column.
