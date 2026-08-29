# 乗車券 — the return ticket

Status: **approved 2026-08-29.** Not a launch item. Week one, after the audio clarity sample.

---

## The problem it solves

Guest progress lives in `localStorage`. It is stuck on one browser, invisible to the parent's
own phone, and gone if the child's device is cleared. Meanwhile the product's return mechanism —
the echo, due in 20 hours and again at ~168 — depends entirely on somebody remembering to come
back.

A bookmark does not survive any of that. A ticket does.

## What it is — two tickets, two jobs

**乗車券 — one per session, not per character.** At the end of a session the child can take a
ticket listing the characters ridden today (up to five), today's status, **one return date**,
and a QR back into the app.

One per session, deliberately. A child who rides five characters would otherwise get five
share-sheet interruptions, five near-identical images in the camera roll, and five tickets
bearing the same date. The reminder job is done once; issuing it five times makes the object
disposable, and a 記念乗車券 arriving every few minutes is not one anybody keeps.

**The return date is the earliest echo due among that session's characters** — the date
something is actually waiting, which is what a fridge needs to say.

**かんぺき券 — issued only when a character turns green.** One character, gold stamp, the date
it was earned, on the day the second echo passes and the car couples to the train. Rare by
construction: roughly one per character per lifetime.

The frequent ticket reminds. The rare one rewards. Making one object do both is what makes a
collectible feel cheap.

記念乗車券 is already something Japanese children collect and parents keep. The format is
borrowed, not invented, and it belongs to the world the product is already in.

## Contents

| Field | Source |
|---|---|
| Characters ridden today, up to five | the session's characters |
| Station name | the train's editorial name (e.g. はるのえき) |
| Status | だいたい — never かんぺき, which is days away |
| **Return date** | the **earliest** `almostAt + echoFirstDelayHours` in the session, as a **calendar date**, never "in 2–3 days" |
| QR | resume URL — the account's if registered, the entrance page if guest |
| Footer | `kanji-ai.jp`, issue date |

**The specific date is the whole point.** 「8月31日」 beats 「2〜3日後」 because a parent glancing
at the fridge on Sunday knows today is the day. The engine already holds that timestamp; this
just moves it into the physical world, where it does not depend on a child remembering.

## The design principles behind it

**The child is the delivery mechanism.** Do not build a parent report into the ticket. Build a
ticket a child *wants to hand over*, and put on it the two things a parent needs at a glance:
the date, and whether anything is waiting. The information reaches the parent because the child
brings it — which costs the parent nothing and is worth more than any notification.

**Frame it as an instrument, not a prize.** Rewards given *for* an activity reliably undermine
the motivation to do it: the child starts riding to collect tickets, and when tickets stop
being exciting the riding stops too. The defence is framing. This is your ticket **for the next
train**, not payment for the last one — which is why the return date is the most prominent
element on it, and why the ticket is functional before it is commemorative.

**Three tiers, because one frequency cannot do two jobs.**

| Ticket | Issued | Frequency | Job |
|---|---|---|---|
| **乗車券** | end of a session | every session | carries the return date — the reminder |
| **かんぺき券** | a character turns green | once per character, ever | the achievement |
| **完乗証** | a leg of 36 completed | ~3 per grade | the climb, tied to the 合目 model |

A collectible issued every few minutes is not collectible. A reward that only arrives every
few weeks does not remind anyone of anything. The ladder lets each object be honest about what
it is.

**The collection is the status report.** A fridge with eight tickets tells a parent their child
rode eight times — no dashboard, no login, no number. Physical accumulation *is* the analytics,
and it is honest analytics, because it can only show what actually happened.

**The punch closes the loop.** Japanese tickets are punched at the gate. When the child returns
on the printed date and completes the echo, the app marks that ticket 使用済み (via the QR, or
matched automatically). An unpunched ticket on the fridge is a quiet, non-nagging prompt that
something is still waiting — which no notification achieves without being resented.

**One vocabulary across child and parent.** The ticket says 「つぎのでんしゃ 8月31日」; the parent
report must use the same words and the same date. If the report says "review due" while the
fridge says 「つぎのでんしゃ」, the parent has to translate, and the family cannot discuss it in
one language.

**Absence must be silent.** No streaks. No "3日 のっていません". No gap markers in the ticket
book. The moment a parent expects a daily ticket, a missed day becomes a failure and the object
turns from a gift into an obligation — for both of them. Tickets record what happened; they
never record what did not.

**Relationship to the stamp book.** The stamp book is already the permanent in-app record of
かんぺき. The かんぺき券 is not a second system — it is that stamp made portable. Same event,
same day, one shareable and one archival. They must never be able to disagree.

## Why it also helps conversion

到着 currently asks the parent 「つづきを ほぞんしますか」. Adding 「きっぷを もらう」 gives the
*child* a reason to want their progress saved — and a child asking a parent to save their train
is a better conversion path than a prompt aimed at an adult who is half-watching.

Offer the ticket first, the save prompt second. Declining either must cost nothing.

## Implementation notes

Canvas render → PNG → share sheet or download. No server round-trip, no account required.
Ink-wash palette, `#7E9C68` car green, `#B4432F` header — same tokens as the app.

**Never render a 乗車券 showing かんぺき.** Same rule as the practice card (MR-7.3, I7): the
session ceiling is だいたい. かんぺき has its own ticket, issued only on the day the second echo
passes.

**Never auto-generate or auto-download.** The ticket is offered; the child taps. An image
appearing in a parent's camera roll unasked is an annoyance, not a gift.

## Adjacent, same cost, do at the same time

**Reframe the home-screen prompt.** Not 「ホーム画面に追加」 but 「じぶんの えきを つくる」.
Identical technical action; belongs to the metaphor; and a station on the home screen is a
one-tap return. The PWA manifest already exists from the harvest.

**OG tags on both hosts.** Japanese parents share links in LINE, and a link with no preview
card reads as spam in a chat thread. `og:title`, `og:description`, and a 1200×630 image of the
train. Ten minutes, and it decides whether a parent-to-parent recommendation survives being
pasted.

**QR in the YouTube end card**, pointing at `kanji-ai.jp`. Someone watching on a TV cannot tap
a link.

## Deliberately not doing

Email capture before launch — low conversion for a free product, and it pulls in
privacy-policy obligations better handled properly than hastily on a children's site. A LINE
official account is the right Japanese channel eventually; it is a week-two project with its
own setup.
