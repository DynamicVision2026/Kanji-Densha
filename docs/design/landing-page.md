# Landing page — design specification

Status: **approved 2026-08-28.** Design authority for `kanji-ai.jp`. Separate repository,
separate deploy.

---

## 1. What this page is for, and what it is not

The **entrance page** (`app.kanji-ai.jp`) is a door: three seconds, three buttons.

The **landing page** is where a cautious parent *reads* before tapping. It carries the depth —
how the learning works, why かんぺき takes days, who is behind it — and hands off. It never
duplicates the three doors; every CTA goes to the app root and lets the entrance page take over.

Primary traffic source is YouTube, so **assume a phone**, and assume the visitor has just
watched a video and knows nothing about the product.

## 2. Domain structure — set up today, not on launch day

| Host | Serves | Deploy |
|---|---|---|
| `kanji-ai.jp` | this page, static | static host |
| `app.kanji-ai.jp` | the product | Cloud Run |
| `www.kanji-ai.jp` | 301 → apex | — |

Subdomain rather than a path (`kanji-ai.jp/app`) because path-based routing needs a proxy in
front of both and couples the two deploys together. On this timeline that trade is not worth it.

**Why it matters commercially:** a parent who taps 「はじめてみる」 stays on a domain they
recognise instead of being handed to a `run.app` URL, which is exactly where a cautious parent
stops. A `.jp` also reads as a company operating in Japan under Japanese law — a real trust
signal for this audience, and free.

DNS, verification, and certificates are unpredictable; do them immediately. Also set up a real
address on the domain — `info@kanji-ai.jp`. A free webmail address in the footer of a
children's education site quietly undercuts everything the `.jp` just bought.

## 3. Technology

Plain static HTML and CSS. No framework, no build step, no analytics beyond a single privacy-
respecting counter if you want one. It must be editable in ten minutes when a video lands, and
it must be structurally incapable of affecting the app or its gates.

Japanese only. One page, no navigation — a scroll with a repeated CTA.

## 4. Sections, in order, with copy

**Hero**
- Eyebrow: `漢字でんしゃ ・ 文部科学省 1026字` — connects the domain name to the product name
  immediately, so nobody wonders whether they are in the right place.
- Headline: `1026字を、列車に乗せて。`
- Lead: `おぼえた漢字が、一両ずつ 列車になります。` / `小学校で習う1026字を、6年かけて ゆっくり。`
- CTA: `はじめてみる` · caption `登録はいりません・1分でためせます`

**1文字を、4つのステップで。** — numbered, four lines:
`であう` 　はじめて出会う一文字を、絵とことばで。
`わかる` 　読みと意味を、音といっしょに。
`ためす` 　読み・意味・形を、少しだけ。
`とうちゃく` 　きょうの到達を、正直に。

**「おぼえた」で、終わりにしません。** — *the most important section on the page.*
`その日にできたことは、だいたい。2〜3日あとと、1週間あとに 列車がもどってきます。そこで もういちどできて、はじめて かんぺき。`
Then the three-step strip: `1日目 だいたい › 3日目 ふりかえり › 8日目 かんぺき`
Footnote: `忘れかけたころに もういちど会うほうが、記憶に残ります。だから すぐには「かんぺき」になりません。`

**かんぺきになった字が、列車になります。** — the train illustration, then
`1文字が1両。学年の漢字がそろうと、列車は山をひとつ登りきります。`

**保護者の方には、「いま」が見えます。**
`どの字が かんぺきで、どの字が もう少しか。1週間の記録と、紙で書くとよい字を5つまで。`
Smaller: `アプリは 読み・意味・形をあつかいます。書き取りは 紙と学校で。`

**Trust list** — four ticks, no adjectives:
`専用タブレットは いりません` / `お子さまに 料金の画面は 出ません` /
`文部科学省の 学年別漢字配当表にそって` / `音読みは 小学校で習う読みだけ`

**つくっている人たち** — company name, location, two or three sentences on why this exists,
contact. **Founder to write.** A solo founder building something careful is a *better* story
for a cautious parent than a corporate voice; do not hide behind one.

**Closing CTA** — vermilion band: `まずは 1文字、のってみませんか。` · `はじめてみる` ·
`登録はいりません`

**Footer** — プライバシーポリシー ・ 利用規約 ・ お問い合わせ ・ クレジット表記 ・ © 2026.

## 5. Why the eight-day section carries the page

In a category full of 「すぐ身につく」 claims, telling parents the product **deliberately
withholds** かんぺき until a character survives a week is the strongest credibility signal
available — and it is the only one that is literally true of the engine. It also pre-explains
the delay, so a parent checking on day two does not feel cheated.

Do not soften it, and do not move it below the fold on mobile.

## 6. Prohibited

Guaranteed-improvement or score-raising claims. Test-result promises. Fear framing
(「このままでは遅れます」). Comparison to other children or other products by name. Stock photos
of smiling children. Countdown timers or scarcity. Pricing — launch is free, and the page says
nothing about future pricing until there is a plan to describe.

## 7. Responsive

Single column at every width, max content width ~640px centred on desktop. The page is a
scroll, not a layout. Test at 360, 768 and 1280.
