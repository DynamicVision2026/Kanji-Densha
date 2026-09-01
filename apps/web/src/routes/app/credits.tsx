import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n/i18n";

// Hand-kept from docs/licenses.md's register — that file is the authority
// ("if an asset is not here, it is not in the build"). Only assets actually
// shipping today are listed: VOICEVOX:Nemo is registered there for *future*
// generation but no VOICEVOX audio ships yet, so it stays out of this page
// until it does.
const ASSETS = [
  { key: "shapeLicense", name: "KanjiVG", detail: "CC BY-SA 3.0" },
  { key: "audioLicense", name: "xAI TTS", detail: "voice: eve" },
  { key: "fontLicense", name: "Noto Sans JP", detail: "SIL Open Font License 1.1" },
] as const;

export const Route = createFileRoute("/app/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <main className="mx-auto max-w-lg space-y-6 px-5 py-10">
        <h1 className="font-display text-2xl">{t("creditsTitle")}</h1>
        <p className="text-sm leading-6 text-fg-muted">{t("creditsIntro")}</p>
        <ul className="space-y-4">
          {ASSETS.map((a) => (
            <li key={a.key} className="rounded-lg border border-border bg-surface p-3">
              <p className="font-display text-base">{a.name}</p>
              <p className="mt-1 text-xs text-fg-subtle">{a.detail}</p>
              <p className="mt-2 text-sm text-fg-muted">{t(a.key)}</p>
            </li>
          ))}
        </ul>
        <Link to="/app/parent" className="inline-block text-sm underline">
          {t("creditsBack")}
        </Link>
      </main>
    </AppShell>
  );
}
