# Site architecture — landing, entrance, app, storefront

Status: **approved 2026-08-29.** How the four surfaces relate, what each owes the visitor, and
where the commercial and legal obligations land.

Not legal advice. The 特商法 section below is a checklist for a professional review, not a
substitute for one.

---

## 1. Four surfaces, three of them public

| Surface | Host | Job | Built |
|---|---|---|---|
| **Landing** | `kanji-ai.jp` | Trust. Who we are, how it works, why it can be believed. | spec written |
| **Entrance** | `app.kanji-ai.jp/` | The animated train and three doors. Three seconds to a decision. | shipped, PR #15 |
| **App** | `app.kanji-ai.jp/*` | The product. Child path and parent path. | shipped |
| **Storefront** | Shopify | Checkout only. Never touched by a child. | later |

**The entrance page IS the welcome page.** There is no fourth screen and no animated
interstitial between landing and app — the animated train lives on the entrance page. Landing →
Entrance → ride is two surfaces before a child touches a kanji, which is already one more than
ideal. Every additional screen between a YouTube click and 一 loses people.

## 2. What the landing page must carry for a Japanese audience

Beyond the sections in `landing-page.md`:

**運営者情報 — required for credibility, before it is required by law.** Operating entity name,
address, and a contact method that a person actually answers. A Japanese parent evaluating an
unknown children's product looks for this, and its absence reads as a reason to leave. A real
address on the domain (`info@kanji-ai.jp`) rather than free webmail.

**プライバシーポリシー — required now, not later.** APPI applies, the users are children, and a
children's education site without one is a trust problem for exactly the cautious parent this
page is written for. Must state plainly what is collected, that no payment screen is shown to
children, and how a parent deletes their family's data.

**利用規約** — ordinary terms; can be brief while the product is free.

**How it works** — already specified: the four beats, the eight-day loop, the train, the ticket.
The ticket belongs here now: 「のったあと、きっぷが もらえます。つぎの でんしゃの 日づけが
書いてあります。」 It is a concrete, photographable proof of how the reminder works.

**Social proof — you have none, and manufacturing it is the one unrecoverable mistake.**
Fabricated testimonials on a children's education site destroy exactly what this page exists to
build. Use what is true instead: MEXT alignment verified against the ministry's own
音訓割り振り表, a product that openly refuses to call a character learned until it survives a
week, and the founder's own reason for building it. Real families' words go up in week three,
attributed, with permission.

## 3. 特商法 — triggers on selling, not on launching

**While the product is free:** 運営者情報 and プライバシーポリシー. No 特商法表記 obligation.

**The day Shopify goes live**, a 特定商取引法に基づく表記 page is required — seller name and
address, a contact telephone number, price, payment method and timing, delivery/access timing,
and return and cancellation terms.

**For a subscription, the 2022 amendment adds a harder requirement**: the *final confirmation
screen* — the one immediately before the purchase button — must display the contract terms
explicitly. For auto-renewal that means **renewal timing, price, how to cancel, and the
cancellation deadline**, all clearly, on that screen.

**That screen is Shopify's, not the app's.** So the compliance burden sits on the storefront,
and a default subscription checkout does not necessarily satisfy it. Budget time to configure
it and have it reviewed before the first sale.

**Direction of travel:** 消費者庁 opened a デジタル取引・特定商取引法等検討会 in January 2026
aimed at dark patterns and obstructed cancellation, with an interim report expected in summer
2026, and 2025 enforcement already targeted businesses that made cancelling deliberately
difficult. The product's existing principles — declining costs nothing, no price screens for
children, cancellation as easy as signing up — sit on the right side of that. Keep them there.

## 4. The Shopify bridge

**Hard rule, inherited from the child-safety constraints and stated on the landing page as a
promise: the purchase path exists only behind the parent surface.** No price, no plan, no
upgrade prompt, and no link to the storefront is reachable from the child path — not in a ride,
not at 到着, not on the child's home. If a child hits a limit, they see the end of the free
content, never a paywall.

**The handoff needs identity, or the return is broken.**

1. Parent, authenticated, in the parent surface, taps 「プランを見る」.
2. App redirects to Shopify with a stable, non-guessable reference to the account.
3. Shopify completes checkout and hosts the final confirmation screen (§3).
4. **Webhook** on order/subscription created → app grants entitlement to that account.
5. Return URL lands the parent back in the parent surface, entitlement already visible.

Entitlement is granted by webhook, never by the return URL — a return URL is a claim from the
browser and can be forged. Design the seam now even though it is built later; retrofitting
identity linking after launch is far more expensive than reserving the field.

**Cancellation must be as easy as purchase**, discoverable from the parent surface, and it must
never degrade the child's saved progress. A cancelled family keeps their train.

## 5. Sequencing

**Before launch (free):** landing page with 運営者情報, privacy policy, terms, credits. Entrance
and app as shipped. No pricing, no storefront, no mention of future price.

**Week two or three:** real testimonials with permission. The ticket in parents' hands. First
`echo_rejections` data.

**Before the first sale:** 特商法表記 page, Shopify final-confirmation screen configured and
reviewed, the identity bridge, entitlement webhook, cancellation flow — and a professional pass
over all of it. Do not sell before that pass.
