# Parent-persona brief — architect review

Reviewed 2026-08-26. The brief is well-structured and the product questions in §§1–6 are the
right ones. **One reframe, four conflicts with existing decisions, and a seeded evidence
section so the document does not begin from nothing.**

---

## 1. The reframe — this is a hypothesis document, not research

Claude Code has no access to Japanese parent surveys, no market data, and policy-blocked
egress. What it *can* do is write fluent, confident, entirely invented personas. The brief
anticipates this ("do not invent market facts without citing sources or marking them as
assumptions") — but in practice roughly ninety percent of this document will be assumption,
and a document of confident-sounding assumptions is more dangerous than no document. Six weeks
on, nobody remembers which lines were evidence, and the registration flow gets built on the
guesses.

So:

- **Rename the deliverable** `docs/research/japanese-elementary-parent-hypotheses.md`. The
  filename is the first thing a future reader trusts.
- **Tag every claim** `[EVIDENCE]` with a source and date, `[ASSUMPTION]`, or `[DESIGN]` for
  decisions that follow from repo documents rather than from the market. A section with no
  `[EVIDENCE]` tags says so at the top.
- **Invert the priority.** Section 12 — open questions requiring validation — becomes the
  document's *primary* output, not its appendix. The most valuable artifact here is a
  ready-to-run interview guide of eight to twelve questions, because that is the thing that
  converts assumptions into evidence. Everything above it is scaffolding for those questions.
- **Force a ranking.** Five personas is a taxonomy, not a strategy; you cannot design a
  registration flow for five people at once. The document must name **one primary persona**
  for the beta and say what is being deprioritised. My read is that the Learning-Support
  Parent — the one who has already noticed their child struggling — is the only segment with
  active, present pain, and everything the product does well speaks directly to them. Argue
  with that, but pick someone.

## 2. Seeded evidence — use these, do not invent more

Verified 2026-08-26. This is the entire evidence base; anything beyond it is an assumption
until an interview says otherwise.

**Category price anchors (通信教育, monthly, tax included, monthly-payment):**
進研ゼミ小学講座 runs 小1 ¥4,080 / 小2 ¥4,580 / 小3 ¥5,480 / 小4 ¥6,590 / 小5 ¥7,560 /
小6 ¥7,970, rising with grade; annual lump-sum payment is cheaper.
*Source: alc.co.jp comparison, July 2026.*

**The lock-in that shapes parent feeling about this category.** スマイルゼミ charges a
dedicated tablet fee of ¥9,980 (¥10,978 incl. tax) on top of monthly fees, and levies an early
withdrawal charge — ¥6,980 if leaving between six and twelve months, ¥29,820 if leaving before
six months. *Source: smile-zemi.jp official pricing page.*

**This is the most actionable fact in the whole review.** Kanji Densha is a web/PWA: no device
purchase, no hardware to return, no exit penalty. That is a genuine structural difference from
the category leader, it maps exactly onto the "can I manage or cancel it?" step in the brief's
own decision sequence, and it can be stated plainly without a single exaggerated claim.
「専用タブレットは いりません」 is both true and, for a parent who has been burned, the entire
pitch. Build the trust section around it.

**Category framing:** 通信教育 is commonly positioned at roughly one-third to one-tenth the
cost of 塾. *Source: gaku-sim.com, April 2026 — a comparison site, treat as indicative.*

**Not yet gathered, and worth one search each before writing:** 漢字検定 participation scale
among elementary children (the product's 漢検 anchoring depends on it), and household
tablet/smartphone availability for elementary children. Mark both `[ASSUMPTION]` if not found.

## 3. Conflicts with existing decisions — resolve these before writing

**§2 versus `docs/design/welcome-screen.md` §10.** The welcome screen's hierarchy is locked:
train, primary CTA, stamp book, and it explicitly prohibits sales content. Parent reassurance
therefore does **not** go on the child-facing scene. The resolution is one discreet
「保護者の方へ」 entry and nothing else — every parent-facing word lives behind it. Without that
boundary the welcome screen becomes a landing page, and the child's home stops being the
child's.

**Do not create a parallel parent vocabulary for the five statuses.** The brief asks to
"change terminology for natural Japanese parent comprehension," and for 残響 → ふりかえり that
is right, because 残響 is internal jargon a parent should never see. But はじめて／まよい／
なおし／だいたい／かんぺき are the words the *child* uses, and a parent who reads different
words cannot talk to their child about what happened today. Keep the same five, add a one-line
parent gloss beside each. Shared vocabulary between parent and child is a feature, not an
oversight.

**The parent report cannot ship before the audio batch.** Its denominator is `teach_ready`
(I9), which is `0/80` today by design (D18). A parent beta right now would show a parent zero
taught characters — honest, and catastrophic as a first impression. Sequence the parent beta
after the Grade 1 audio batch, and say so in the prioritised table.

**Persona 4 is already a specification commitment, not a proposal.** The product spec covers
families in Japan including non-native caregivers, and the i18n line already commits to
Japanese primary with English parent-critical strings and 简/繁 toggles. Treat it as an
existing obligation to design for, not a new segment to justify.

## 4. Scope note

Sections 1, 3, 4, 5 and 6 of the brief — entry points, registration, parent report, purchase
decision sequence, and the Japanese copy guide — are **product design grounded in repo
documents**, and Claude Code can do them authoritatively. Sections 3 and 4 of the *research*
questions — motivations, objections, cancellation behaviour — cannot be answered without
parents. Write the first set with confidence and the second set as tagged hypotheses feeding
the interview guide.

This runs parallel to the build. It must not delay M3, the Q16 follow-up, or the audio pilot.

## 5. One addition to the deliverable

The brief's twelve sections omit the thing that makes the rest usable: **a recruitment and
interview plan.** Six to eight parents of Grade 1–3 children, how to reach them, and the
question list. The founder is already arranging a six-year-old for the M3 observation session
— that visit is also a parent. Ask them the questions.
