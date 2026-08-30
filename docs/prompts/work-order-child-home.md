# Work order — child home, ticket anchor, profiles, sessions

Design authority: `docs/design/child-home-and-sessions.md`, `docs/design/return-ticket.md`,
`docs/design/practice-card-states.md`. Where a spec and this order disagree, the spec wins and
the disagreement is an escalation.

Order of work is by risk, not by feature size. Engine, content gate, and reference table are
untouched throughout. One branch and PR per task, nothing merged without review.

**Task 0 — session store.** Complete (PR #22). Finding stands: the session is an HttpOnly
cookie, and the real hazard was the default 7-day `expiresIn` coinciding with the 168h second
echo. Fixed to 90d/1d, recorded as D28.

**Task 1 — child home: the ticket is the only control.** Branch `child-home-ticket`. Layout top
to bottom: the train (かんぺき cars on the main line, だいたい cars on the siding), then today's
ticket. Nothing else tappable except a small 保護者 control top-right. The ticket must be a
`<button>` with an accessible name, not a decorated `div` — it is now the primary control of the
child experience. Minimum 64px tap height; the whole ticket is the target, not just the
▶ のる strip. Boarding-pass face shows today's stations, the count, whether an echo is due, and
▶ のる; its contents derive from the same scheduler that builds the session, so the ticket can
never promise a character the ride then doesn't offer. Empty state: 「きょうは おやすみ」 plus
the next date — never a blank card, never an invented task. No CTA button beside it, no nav bar,
no menu.

**Task 2 — the siding.** だいたい characters render as pale cars on a dashed track below the
main line, from the moment they reach だいたい. Car styling per `practice-card-states.md`: pale
green fill, solid border, dark ink — not dashed borders, because dashes mean "not yet real"
product-wide and these are real, just waiting. On the return date a car couples: it moves from
the siding onto the main line, visibly, not as a re-render. Derive from `CharacterProgress`
through the existing `toTrainCar` mapping (I5). Main-line cars are selected by
`stampedAt !== null`, never current status (D20).

**Task 3 — profiles.** One household account, multiple child profiles. Parent authenticates
once; device stays signed in. With more than one profile, a station board shows one card per
child (nickname + their train), tap to enter; single profile and signed in skips straight to
the home. No password, PIN, or credential ever appears on the child path. The parent surface is
what requires authentication. Keep the hold-to-open parent door as an additional path, but the
visible 保護者 control is primary.

**Task 4 — registration and save at 到着.** First 到着 at だいたい → 「つづきを ほぞんしますか」
above つぎへ, never replacing it → `/onboard` → email + credential → nickname and grade → guest
progress imported via D27. Non-negotiable: the guest import must not be blocked by email
verification. Save first, verify later. Do not change the auth method. Declining costs nothing —
stay guest, ask again once per session, no paywall, no degraded ride. Also wire
「じぶんの えきを つくる」 at 到着 after the save prompt; it is load-bearing, not cosmetic,
because guest localStorage remains ITP-subject.

**Task 5 — the punched stub.** Per `return-ticket.md`: one per session, punched, dated with the
earliest echo due among that session's characters, QR, saveable. Never renders かんぺき
(MR-7.3, I7).

## Tests

Ticket is a button with an accessible name and the whole ticket is the tap target; empty state
renders with a date and offers no session; boarding pass and actual session agree on which
characters are due; だいたい car appears on the siding on status change; a car couples on the
return date; a regressed かんぺき character keeps its main-line car; no credential input
reachable from any child route; rendering the child home emits zero progress events; guest
import completes without email verification; declining the save prompt leaves the ride unchanged
and re-asks once per session; breakpoints 767/768/1023/1024.

## Prohibited

Passwords on the child path. Prices, plans, upgrade prompts or storefront links anywhere a child
can reach. Streaks, missed-day counts, or anything competing with the ticket for the primary tap.
