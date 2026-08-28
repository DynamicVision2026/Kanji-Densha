# Prototypes

Standalone visual prototypes live here. They are **not product code** and are exempt from
almost everything in `CLAUDE.md`.

A prototype is one self-contained `.html` file. No build step, no framework, no imports, no
tests, no CI. It opens by double-clicking it. Its whole job is to be looked at and argued
with, and then thrown away — the value is the argument it settles, not the code.

`kanji-densha-moving-switchback.html` in this directory is the **reference standard**. When a
brief says "prototype quality," it means that file.

## When to build one

Before implementing any visual or interactive design that hasn't been seen yet. It is
faster to argue with a running prototype than with a description, and far faster than
arguing with a half-built component that someone is now attached to.

Build one when: the design isn't settled, motion or timing is involved, several states need
comparing side by side, or a number in a spec (a duration, a spacing, a threshold) needs to be
felt rather than read.

Skip it when the design is already specified and the work is implementation.

## What makes one good

The reference file does these things and they are the standard, not decoration:

- **Self-contained.** One file. Inline `<style>` and `<script>`. No CDN, no npm, no fonts to
  fetch. It must still work in a year with no network.
- **Every state reachable by a button.** Not one static frame — 4 cars, 12, 30, reduced
  motion, pause, and a live "Earn 森" that mutates the data. The reviewer explores rather than
  imagines.
- **Driven by a data array**, exactly as the real component will be. If the prototype fakes
  its data, it proves nothing about the component that follows.
- **A caption under each state** saying what the reviewer is looking at and what decision it
  represents. Without it, half the design intent doesn't survive the handoff.
- **Real text nodes for anything that is text.** A prototype that draws kanji as paths hides
  precisely the legibility question it exists to answer.
- **Roughly a hundred lines.** If it needs more, the thing being prototyped is too large a
  question — split it.

## Working rule

The prototype comes first, gets reviewed, and only then does the component get written. The
prototype is never converted into the component — it is read, and the component is written
fresh against the design document, in the real stack, with the real tests.

Prototypes are committed so that a future reader can see what was actually approved rather
than reconstructing it from prose. They are never imported, never built, never shipped.
