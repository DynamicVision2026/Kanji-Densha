# Welcome screen brief — architect review

Reviewed 2026-08-24. The brief is good: specific constraints, a clear refusal of arcade
reward patterns, and the right instinct that the animation must not block the learning action.
Five changes before it goes to an implementer, and a note on sequencing.

---

## 0. Sequencing — this is not M3, and it cannot be built yet

**No child can have a green car for at least a week.** かんぺき requires two spaced echoes
(MR-5.4): first at 20h, second at ~168h. A brand-new user's train is empty on day one, empty
on day three, and empty until day eight at the earliest. And right now no character can reach
teach-ready at all until the audio batch lands.

So this screen cannot be validated against real data until M5, and building it now means
designing a home screen around a state no user can reach.

**Do this instead.** Bring a static mockup of the screen to the M3 child session and watch
where a six-year-old's eyes go when they see the train next to the primary CTA. That is
cheaper than building it and answers the only question that matters — whether the train earns
its position or distracts from the ride. Build it for real in M5, alongside the timetable and
stamp book it belongs with.

---

## 1. The empty state is the hero state, not the fallback

The brief treats "0 mastered kanji" as one of three cases. It is the **default experience for
every child for the first week**, and for a struggling child, much longer.

Design it first and design it well. A locomotive standing before a row of muted empty cars
reads as an accusation of emptiness — the child sees a train that is mostly missing. The
framing has to be *departure*, not *deficit*: the locomotive is ready, the journey is starting,
the first station is right there. The proposed copy is close and its instinct is right —
keep it forward-facing.

**Concretely:** design and review the zero-car and one-car states before the ten-car state.
A screen that looks magnificent at ten cars and sad at zero is a screen that is sad for
the entire period when a child is deciding whether to come back.

## 2. Cars never detach — decide this before drawing anything

The brief is silent on regression. Per MR-7.7, a かんぺき character can drop back to なおし on
a wrong answer. Does its car leave the train?

**No. Once attached, always attached.** This is D7's logic — the stamp is write-once — applied
to the same event. A child watching their train get *shorter* is being punished by an
animation, which is precisely the arcade dynamic the brief otherwise refuses. Regression is
handled on the timetable and in the parent's attention list, where it can be acted on. It does
not touch the hero.

Recorded as **D20**.

## 3. Do not redefine status — derive it

The brief declares `status: "perfect" | "almost" | "future"`. The engine has five statuses,
and invariant I5 says the UI must not invent a second status algorithm. A three-value type
sitting next to a five-value one is exactly how the two drift apart.

Take `CharacterProgress` as the input and derive the car's presentation in **one exported
mapping function** with the collapse stated explicitly:

```
perfect            → attached green car
almost             → waiting car (side track)
new | fix | lost   → future/muted
```

Collapsing なおし and まよい into "future" on this screen is the right call — the home screen
is not where a six-year-old should meet the word for "lost" — but it must be a deliberate,
single-source decision, not an accident of a narrower type. And it has a consequence to accept
knowingly: **repair work is invisible here.** The child learns about なおし on the timetable
and through the recommended-station CTA, which makes that CTA load-bearing rather than
decorative.

## 4. The magic numbers are parameters, not constants

1.2–1.8 seconds of readability, 6–10 cars per loop, 11+ as the rotation threshold — these are
reasonable guesses and they are guesses. Put them in a props/config object with the same
justification comment style as `grades.yaml`, so the child session can retune them without a
code change. If a six-year-old drifts at ninety seconds, the loop length is wrong, and you
want that to be a one-line edit.

## 5. Technique follows from two constraints already in the brief

"Data-driven cars from the learner's actual perfect status" plus "kanji must remain accessible
text" rules out baked animation formats for the glyphs — a Lottie or Rive export cannot carry
live text nodes. So the shape is settled: **the scene is layered CSS/SVG with parallax, and
each kanji is a real text node** riding a transformed element, not a rasterized frame. That
also gives reduced-motion for free (freeze the transforms, keep the layout) and keeps mobile
Safari honest. Anything heavier needs a measured justification, not a preference.

---

## Additions to the test list

The brief's list is good. Add two:

- **Regression:** a car whose character drops from `perfect` to `fix` stays attached (D20).
- **Read-only:** rendering the welcome screen, including the tap-a-car card, emits **zero**
  progress events. This screen reads `CharacterProgress`; it never writes one.

## Keep as written

The staged-deliverable rule — visual direction reviewed before implementation, PR only after
approval — is right and matches how M0–M2 ran. Hold to it.
