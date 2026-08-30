import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n";

/**
 * child-home-and-sessions.md §5 — 「じぶんの えきを つくる」 at 到着, after
 * the save prompt. Load-bearing, not cosmetic: Safari's ITP purges
 * script-writable storage (guest progress lives in localStorage) after
 * seven days of no interaction on a site that isn't installed — exactly
 * the second echo's own interval. An installed PWA is exempt.
 *
 * Chrome/Android fire `beforeinstallprompt`, which this captures and
 * replays on tap. Safari (iOS) never fires it — there is no programmatic
 * install there — so this falls back to the manual "Share, then Add to
 * Home Screen" instruction instead of silently doing nothing on exactly
 * the browser this feature exists for.
 *
 * Hidden entirely once already installed (`display-mode: standalone`, or
 * iOS's own `navigator.standalone`), and once dismissed for this
 * component instance — trigger/placement/throttle-per-session is the
 * caller's job, same division as SavePromptBanner.
 */
export function HomeScreenPrompt({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(standalone));
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !standalone);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (installed) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
    onDismiss();
  }

  return (
    <div className="mb-2 rounded-xl border border-border bg-surface p-4" data-install-prompt>
      <p className="font-display text-base">{t("installTitle")}</p>
      <p className="mt-1 text-sm leading-6 text-fg-muted">{t("installLead")}</p>
      {ios ? (
        <p className="mt-2 text-xs text-fg-subtle" data-install-ios-hint>
          {t("installIosHint")}
        </p>
      ) : null}
      {/* Declining must always be reachable, on every platform — the same
          "costs nothing" rule as SavePromptBanner's あとで. Chrome/Android
          additionally get a real install button when the browser has
          actually offered one; other platforms (desktop, or Android before
          its own engagement heuristic fires the event) still get the
          dismiss control even with nothing to actively press. */}
      <div className="mt-3 flex gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={install}
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm text-primary-fg"
          >
            {t("installAction")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          className={`flex h-11 items-center justify-center rounded-lg border border-border bg-bg text-sm text-fg-muted ${
            deferred ? "flex-1" : "w-full"
          }`}
          data-install-decline
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};
