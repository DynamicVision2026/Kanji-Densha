# M3 observation protocol — the first ride

M3's exit criterion is a child riding 山 start to finish on a real phone without an adult
translating the UI. This document exists because those four minutes are the most valuable
data the project will generate all month, and they are easy to waste by accident.

Arrange this now, in parallel with the build. It has the longest lead time of anything
remaining and it is not a technical task.

## Setup

- One child, six or seven years old. First grade, or just finishing it. Not a nine-year-old
  who will succeed at everything and teach you nothing.
- Their own phone or a parent's — the device they normally use, held the way they normally
  hold it. Not your dev machine, not a tablet propped on a stand.
- A parent present but not helping. Tell them explicitly beforehand: if the child gets stuck,
  we need to see them stuck. The instinct to rescue is strong and it destroys the data.
- Say almost nothing. "Have a go at this" and then silence. Every hint you give is a UI
  affordance you now can't evaluate.
- Record the screen if the parent consents, or take notes. Do not rely on memory — you will
  remember the moments that confirm what you already believe.

## What to watch for

Attention, in order of what it will teach you:

1. Where do their eyes go first on 出会う? The hero character, the illustration, or the
   button? If it's the button, the encounter beat is decoration and the whole ink-wash
   direction is worth less than the money it costs.
2. Do they press the speaker without being told? If not, the affordance is wrong — and audio
   is the one thing the app does that paper cannot.
3. Where do they hesitate? Hesitation is the signal. Note the screen and the second, not your
   theory about why.
4. Do they understand 到着 means "come back later"? This is the hardest copy in the product.
   A child who thinks they finished, or thinks they failed, means the sentence is wrong. Ask
   afterwards: 「またやりたい？」and 「これ、おわった？」
5. How long before they look away? Time it. If a ride is meant to be three minutes and they
   drift at ninety seconds, `sessionItemCap` is wrong, not the child.

## What not to do

- Do not ask "was that fun?" Children say yes to adults holding phones. Ask what happened,
  what they'd do next, which one they liked — questions with wrong answers.
- Do not fix anything mid-session, or explain a screen, or reach for the phone.
- Do not test with your own explanation of the metaphor first. If the train needs explaining,
  it doesn't work.

## Afterwards

Write it up the same day, before you rationalise it. Two lists: what they did, and
separately, what you think it means. Keep them apart — the first list is evidence and stays
true; the second is a theory and will change.

Then bring both back. M4's shape system gets designed against what you saw, not against the
specification — that is why M4's prompt was deliberately left unwritten.
