const KEY = "densha.hasRidden";

/**
 * Set the first time a child actually rides — not the seeded demo greens,
 * which every visitor has on first load and which would send everyone
 * straight past the door (entrance-page.md §1).
 */
export function readHasRidden(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markHasRidden() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
