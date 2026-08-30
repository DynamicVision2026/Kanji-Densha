# Child home, sessions and profiles

Status: **approved 2026-08-29.** Design authority for what a child sees when they open the app,
how accounts and profiles work, and the session constraints that make the eight-day loop
survivable on an iPad.

---

## 1. The child home has exactly one control: the ticket

Two elements, in this order:

1. **The train** — what the child owns. かんぺき cars on the main line; だいたい cars waiting on
   a **siding** below it.
2. **Today's ticket** — what to do. It is the only tappable thing on the screen.

No CTA button beside it, no menu, no navigation bar. A six-year-old opens the app and there is
one thing to press. The ticket *is* the call to action, which is why nothing else may compete
with it visually.

**The ticket must be a real `<button>` with an accessible name.** It is now the primary control
of the entire child experience; a decorated `div` is not acceptable.

**Empty state:** on a day with nothing due, the ticket reads 「きょうは おやすみ」 with the next
date. Never a blank card, and never an invented task. A product that refuses to manufacture
busywork is consistent with everything else here, and a parent will notice.

## 2. Two faces of one ticket

A real journey uses a 乗車券 to board and leaves a punched stub behind. The product does the
same, and the punch is the transition already specified at 到着 (`practice-card-states.md` §5).

| Face | When | Contents | Tappable |
|---|---|---|---|
| **Boarding pass** | on opening | today's stations, count, whether an echo is due, ▶ のる | yes — boards |
| **Punched stub** | after 到着 | what was ridden, 済 mark, **the return date**, QR | no — it is a record |

The stub is what gets saved to the camera roll or printed (`return-ticket.md`). One per session.

## 3. The siding — why the eight-day cycle is not shortened

**The concern:** eight days feels long to sustain momentum.

**The diagnosis:** two clocks were being conflated. The *per-character* clock is eight days. The
*daily engagement* clock is not — a child rides new characters every day, and from day two
echoes are due daily too. Nobody waits eight days for something to do; only a specific character
takes eight days.

**The real risk is different and genuine:** the main line is empty for a week, so a family has
no visible proof until day eight.

**The fix is the siding, not a shorter interval.** だいたい characters appear immediately as
pale cars on a track below the main line. The siding fills every day from day one. On the
return date, cars **couple** onto the train. Accumulation is visible from the first session;
the payoff still lands where the memory science wants it.

**Why not four days.** The landing page's strongest claim — the one no competitor will copy —
is that this product refuses to call a character learned until it has survived a week. Halving
the interval turns that paragraph into marketing. The interval *is* the differentiator.

**If evidence says otherwise:** `echoSecondDelayHours` is grade data, not code. Grade 1 could
move to 120 hours on real drop-off data. Do not change it on a hunch.

## 4. Authentication — guard the exit, not the entrance

The instinct is to PIN-protect the child's profile. But the child path holds no purchases, no
personal data on display, and no settings. There is nothing there to protect. **The parent
surface is what needs a lock**, because that is where billing and account management live.

So: children tap straight in. The parent door asks.

**One household account, multiple profiles.** The parent authenticates once; the device stays
signed in. On open, if more than one profile exists, a station board shows one card per child —
nickname and their train — and a tap enters. **No password ever reaches a child.** A six-year-old
cannot type one and will ask a parent every time, and that friction is where a daily habit dies.

Single profile and already signed in → skip the board, go straight to the home.

## 5. iPad session constraints — a real threat to the eight-day loop

**Safari's Intelligent Tracking Prevention purges script-writable storage, including
localStorage, after seven days without interaction, for sites not installed to the home screen.
The second echo is at 168 hours — exactly seven days.**

A guest family who tries the product, does not return for a week, and comes back on day eight
for the かんぺき moment may find their progress deleted by the browser at precisely the moment
the product's central promise comes due.

Three consequences, all build constraints:

1. **Auth sessions must be server-set `HttpOnly` cookies, never localStorage.** Cookies written
   by the server in an HTTP response are treated differently from script-written storage.
   **Verify what the harvested Better Auth setup actually does** before launch.
2. **「じぶんの えきを つくる」 (add to home screen) is load-bearing**, not a nicety — an
   installed PWA is not subject to that eviction. It is the most valuable thing on the 到着
   screen after the save prompt.
3. **The save prompt's real job is durability**, not convenience: an account moves progress to a
   database where no browser policy can delete it. The copy must not say this — a parent does
   not want to hear about ITP — but the design decision is made knowing it.

## 6. Adults — same model, not before launch

An adult learner is a household with one self-managed profile and no parent above it.
Architecturally free.

**Build nothing for them before launch.** Every choice in this product — 一 as the first
station, kana copy, no scores, the eight-day patience — is designed for a child, and an adult
can use it as it stands. An adult mode splits attention across two audiences in the week that
can least afford it.

## 7. Prohibited on the child home

Passwords, account settings, prices, plans, upgrade prompts, links to the storefront, streaks,
counts of missed days, and any element competing with the ticket for the primary tap.
