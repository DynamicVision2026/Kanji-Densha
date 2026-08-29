// entrance-page.md §6: shown once at 到着-at-だいたい, then "ask again once
// per session" on decline. sessionStorage rather than localStorage — the
// throttle is per-session by definition, and a permanent "never ask again"
// flag would violate the spec directly ("never-again loses people still
// browsing").
const KEY = "densha.savePromptShownThisSession";

export function sawSavePromptThisSession(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markSavePromptShown() {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
