import { createFileRoute, Link } from "@tanstack/react-router";

// entrance-page.md §5 "/parents outline" — content only, not a full visual
// spec (no colours, breakpoints, or copy were reviewed the way the entrance
// page and practice card were). Built to the exact outline given: what it
// is in two sentences, the four beats in plain Japanese, why かんぺき takes
// days, what the parent sees, privacy/child-data boundaries, no tablet
// required and no price screens for children, CTA back to さわってみる.
// No pricing this release.
export const Route = createFileRoute("/parents")({ component: ParentsInfo });

const BEATS = [
  { name: "であう", body: "はじめて見る漢字と出会う画面です。" },
  { name: "わかる", body: "読み方と意味を確かめる画面です。" },
  { name: "ためす", body: "よみ・いみ・かたちの三つを、選択式でためします。" },
  { name: "とうちゃく", body: "その日の分が終わり、今の状態がわかる画面です。" },
] as const;

function ParentsInfo() {
  return (
    <main className="paper-wash mx-auto min-h-dvh max-w-2xl px-5 py-12 sm:px-8">
      <p className="text-xs tracking-[0.2em] text-fg-subtle">保護者の方へ</p>
      <h1 className="mt-2 font-display text-3xl">
        漢字でんしゃは、小学校で習う1026字を、6年かけてゆっくり覚えるアプリです。
      </h1>
      <p className="mt-3 text-base leading-8 text-fg-muted">
        覚えた字が一両ずつ列車になり、そのまま記録になります。テストのための暗記ではなく、
        日々少しずつ、確かめながら進みます。
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg">四つの場面</h2>
        <ul className="mt-3 space-y-3">
          {BEATS.map((b) => (
            <li key={b.name} className="rounded-lg border border-border bg-surface p-3">
              <p className="font-display text-base">{b.name}</p>
              <p className="mt-1 text-sm text-fg-muted">{b.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">なぜ「かんぺき」まで数日かかるのか</h2>
        <p className="mt-2 text-sm leading-7 text-fg-muted">
          一度の練習で覚えたことにはしません。数日空けて同じ字にもう一度出会い、そこでも
          答えられたときにだけ「かんぺき」になります。一度の正解を記憶と勘違いしないための、
          意図した間隔です。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">保護者に見えるもの</h2>
        <p className="mt-2 text-sm leading-7 text-fg-muted">
          お子さまの進み方、つまずいている字、直近の練習記録を、保護者専用の画面で確認できます。
          お子さまの画面に、他の子との比較や順位は一切表示されません。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">プライバシーとお子さまのデータ</h2>
        <p className="mt-2 text-sm leading-7 text-fg-muted">
          学習の記録はお子さまのアカウントに保護者の管理のもとで保存され、他の目的には使いません。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">専用タブレット・料金について</h2>
        <p className="mt-2 text-sm leading-7 text-fg-muted">
          専用タブレットは必要ありません。お子さまの画面に料金や購入の画面が出ることもありません。
          今回のリリースは無料です。
        </p>
      </section>

      <Link
        to="/demo/kanji/$char"
        params={{ char: "一" }}
        className="mt-10 flex h-14 w-full items-center justify-center rounded-xl bg-primary font-display text-lg text-primary-fg"
      >
        さわってみる
      </Link>
    </main>
  );
}
