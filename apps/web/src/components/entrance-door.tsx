import { Link } from "@tanstack/react-router";
import { EntranceScene } from "@/components/entrance-scene";

// entrance-page.md §3 — Japanese only this release, approved copy verbatim.
// Hardcoded rather than routed through the i18n dictionary: this page is not
// part of the child-facing app shell those strings serve, and the spec is
// explicit that no other locale ships this release.
const COPY = {
  eyebrow: "KANJI-KUSOU ・ 文部科学省 1026字",
  headline: "1026字を、列車に乗せて。",
  leadLine1: "おぼえた漢字が、一両ずつ 列車になります。",
  leadLine2: "小学校で習う1026字を、6年かけて ゆっくり。",
  primaryDoor: "さわってみる",
  primaryCaption: "登録はいりません・1分でためせます",
  secondaryParents: "保護者の方へ",
  secondaryLogin: "ログイン",
  trust1: "専用タブレットは いりません",
  trust2: "お子さまに 料金の画面は 出ません",
} as const;

// Literal spec hex, not the theme's `--color-primary` (#c45c48) — the two
// design docs (entrance-page.md, practice-card-states.md) both specify this
// exact vermilion. Close enough to the existing token that it may be the
// same colour re-measured; flagged in the PR rather than silently picked.
const VERMILION = "#B4432F";

// Mobile/tablet: one column, source order. Desktop (>1024px only — 1024
// itself stays tablet, per spec): a 46/54 split with `scene` as a full-height
// right-hand sibling to every row on the left. CSS Grid template-areas is
// the tool for "same DOM order, different visual grouping per breakpoint"
// without duplicating markup — Flexbox `order` alone cannot merge two
// non-adjacent blocks (copy above the doors, doors below) into one shared
// column while a third becomes a spanning sibling, short of an extra wrapper
// that then re-creates the same problem one level up. Both grid templates
// below are expressed as Tailwind arbitrary properties, not a separate
// stylesheet rule, to stay in the one styling system the rest of the app
// uses.
const GRID_MOBILE =
  "[grid-template-areas:'eyebrow'_'headline'_'lead'_'scene'_'door1'_'door2'_'trust']";
const GRID_DESKTOP =
  "min-[1025px]:[grid-template-areas:'eyebrow_scene'_'headline_scene'_'lead_scene'_'door1_scene'_'door2_scene'_'trust_scene']";

export function EntranceDoor() {
  return (
    <main
      className={`paper-wash grid min-h-dvh gap-x-10 gap-y-6 px-5 py-10 sm:px-8 md:py-14 min-[1025px]:mx-auto min-[1025px]:max-w-[1100px] min-[1025px]:grid-cols-[46%_1fr] min-[1025px]:items-center min-[1025px]:py-0 ${GRID_MOBILE} ${GRID_DESKTOP}`}
    >
      <p className="[grid-area:eyebrow] text-[11px] tracking-[0.2em] text-fg-subtle">
        {COPY.eyebrow}
      </p>

      <h1 className="[grid-area:headline] font-display text-[29px] leading-tight md:text-[40px] min-[1025px]:text-[46px]">
        {COPY.headline}
      </h1>

      <p className="[grid-area:lead] text-[14px] leading-7 text-fg-muted md:text-[17px] min-[1025px]:text-[17px]">
        {COPY.leadLine1}
        <br />
        {COPY.leadLine2}
      </p>

      <div className="[grid-area:scene] min-h-0 min-[1025px]:h-full min-[1025px]:self-stretch">
        <div className="h-[250px] w-full overflow-hidden rounded-xl border border-border bg-surface md:h-[430px] md:max-h-[60vh] min-[1025px]:h-full min-[1025px]:max-h-none">
          <EntranceScene />
        </div>
      </div>

      <div className="[grid-area:door1]">
        <Link
          to="/demo/kanji/$char"
          params={{ char: "一" }}
          className="flex h-[64px] w-full items-center justify-center rounded-xl font-display text-xl text-white"
          style={{ backgroundColor: VERMILION }}
        >
          {COPY.primaryDoor}
        </Link>
        <p className="mt-2 text-center text-xs text-fg-subtle">{COPY.primaryCaption}</p>
      </div>

      <div className="[grid-area:door2] grid grid-cols-2 gap-3">
        <Link
          to="/parents"
          className="flex h-14 items-center justify-center rounded-lg border border-border bg-surface px-3 text-center text-sm text-fg"
        >
          {COPY.secondaryParents}
        </Link>
        <Link
          to="/login"
          className="flex h-14 items-center justify-center rounded-lg border border-border bg-surface px-3 text-center text-sm text-fg"
        >
          {COPY.secondaryLogin}
        </Link>
      </div>

      <p className="[grid-area:trust] text-center text-xs leading-6 text-fg-subtle">
        {COPY.trust1}
        <br />
        {COPY.trust2}
      </p>
    </main>
  );
}
