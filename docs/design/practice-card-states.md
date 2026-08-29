# Practice card — visual state machine

Status: **approved 2026-08-28.** Design authority for the child-facing practice card and its
call to action. Governed by `docs/spec/mastery-rules.md`, which decides *what* the state is;
this document decides only how it looks.

The card must answer three questions for a six-year-old without a single word being read:
what level am I at, do I need to do this again, and what do I press next.

---

## 1. The five states

The engine's five statuses map one-to-one. No collapsing, no invented sixth state.

| Engine | Card fill | Border | Kanji ink | Lamps | Primary CTA |
|---|---|---|---|---|---|
| `new` — はじめて | none | **2px dashed** `#B9B2A0` | `#2C2A24` | all hollow | ▶ `はじめる` |
| `fix` — なおし | `#FBF2E2` | 2px solid `#D9A441` | `#2C2A24` | **lit except the one needing repair** | ↻ `もういちど` |
| `lost` — まよい | `#F0EDE6` | 2px solid `#A79F8D` | `#2C2A24` | all hollow | 👁 `もういちど みる` |
| `almost` — だいたい | `#E6F0DC` | 2px solid `#9AAE85` | `#16301F` | all lit | → `つぎへ` |
| `perfect` — かんぺき | `#7E9C68` | 2px solid `#6A8757` | `#F4F1E6` | all lit, light | 🚂 `でんしゃを みる` + gold stamp |

### Three rules inside that table that are not styling

**かんぺき can never appear during a session.** MR-7.3 and I7: a session never grants it; it
requires two spaced echoes, 20h and ~168h apart. A card turning solid green at the end of a
ride would show a state the engine has not granted — the product lying to a child about the
one word it sells to their parent. The green card and gold stamp appear when the child opens
the app on day eight and the echo passes. That is also the stronger moment: the car turns
green and couples to the train on the same screen.

**なおし keeps its lit lamps.** Exactly one lamp goes dark — the one needing repair. A child
who has fixed something must see that they kept what they earned. Collapsing `new` and `fix`
into one grey state tells them they are back at the beginning, which is false and discouraging.

**まよい is the gentlest card in the set, not the harshest.** Warm grey, never red, no frown,
no exclamation. Its CTA sends the child back to わかる, which is what `forceReteachOnWrong` at
Grade 1 actually means in the interface: the train backs up one station. まよい must never read
as a penalty screen.

**The dashed border is product-wide grammar for "not yet real"** — はじめて here, demo cars on
the entrance page. Nothing else in the product uses dashes.

## 2. Lamps

Three fixed positions, in the same order on every card everywhere: **よみ · いみ · かたち**.

- 40px circle, 2px border, minimum 32px at any breakpoint.
- **Lit:** filled with the state's tone colour, icon in `#FFF9F0`.
- **Hollow:** transparent, border and icon `#B9B2A0`.
- Each lamp carries a **distinct icon** as well as its fill — volume, bulb, pencil. Colour
  alone never carries meaning; a green/amber pair fails for a colour-blind child, a
  filled/hollow shape does not.
- The 10px kana label sits beneath for the parent watching over a shoulder and for the older
  child, never as the primary signal.

「どれが たりない？」 must be answerable from shape alone, in about half a second.

## 3. Call to action

**Exactly one primary action per screen.** The failure mode with large icons is three of them
competing; the eye must have one place to go.

- ≥64px tap target, icon at 44px, vermilion `#B4432F`, full width of the card column.
- **Icon plus a short word beneath it.** Not icon-only: a Grade 6 child reads fine, and a
  parent looking over a shoulder needs to know what the button does.
- Every other action on the screen is visually secondary — outline, smaller, muted.
- Never red for anything negative. Vermilion is the *go* colour in this product and must not
  acquire a second meaning.

## 4. Responsive

| Breakpoint | Card | Kanji | CTA |
|---|---|---|---|
| < 768px | full width, one up | 76px | full width, 18px padding |
| 768–1024px | **two up**, grid | 88px | full width of its column |
| > 1024px | two or three up | 88px | full width of its column |

Lamps never scale below 32px. The kanji is the largest element on the card at every width.
Test at 767, 768, 1023 and 1024 exactly.

## 5. Prohibited

Scores, percentages, timers, streaks, comparison to other children, red error states, sad or
disapproving faces, and any copy implying the child is behind or has failed. A wrong answer
produces なおし, and なおし is a repair, not a reprimand.
