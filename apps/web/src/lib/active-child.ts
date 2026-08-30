const KEY = "densha.activeChild";

export function readActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeActiveChildId(id: string) {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

/** child-home-and-sessions.md §4 review ruling: the station board should
 * remember the last profile and skip straight to it, showing again only
 * on first open or when the parent explicitly switches — this is what an
 * explicit switch means: forget the remembered child so /app's own
 * resolution effect falls through to "no stored child" and shows the
 * board again. */
export function clearActiveChildId() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
