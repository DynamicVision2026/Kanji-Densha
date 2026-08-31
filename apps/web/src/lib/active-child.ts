import { useEffect, useState } from "react";

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

/**
 * The one active-child resolution, shared by every route that reads it
 * (routing.md §1/§3 step 2 — `app/index.tsx`, `catalog.tsx`, `stamps.tsx`,
 * `workshop.tsx`, and `parent.tsx` each carried their own, independently-
 * drifted copy of this; four of the five silently fell back to the
 * household's first-created child instead of showing the picker — on
 * `parent.tsx` that meant a parent could see another child's report and
 * progress with no indication it wasn't the one they meant). A single child
 * never needs a decision. More than one needs the remembered child if it's
 * still valid, otherwise `needsPicker` goes true and the caller renders
 * `StationBoard`; `select` is what a tap on it calls. `explicit` is for the
 * few routes reached by a link that already names the child (`?child=...`
 * from `mistakes.tsx`'s back-link, `parent.tsx`'s own child-switch pills) —
 * it always wins, with no ambiguity to resolve.
 */
export function useActiveChild<T extends { id: string }>(
  children: readonly T[] | undefined,
  options?: { onEmpty?: () => void; explicit?: string },
): {
  childId: string | null;
  confirmed: boolean;
  needsPicker: boolean;
  select: (id: string) => void;
} {
  const explicit = options?.explicit;
  const onEmpty = options?.onEmpty;
  const [childId, setChildId] = useState<string | null>(explicit ?? null);
  const [confirmed, setConfirmed] = useState(Boolean(explicit));

  useEffect(() => {
    if (explicit) return;
    if (!children) return;
    if (children.length === 0) {
      onEmpty?.();
      return;
    }
    if (children.length > 1) {
      const remembered = readActiveChildId();
      const stillValid = remembered && children.some((c) => c.id === remembered);
      if (stillValid) {
        setChildId(remembered);
        setConfirmed(true);
      }
      return;
    }
    const only = children[0]!.id;
    setChildId(only);
    writeActiveChildId(only);
    setConfirmed(true);
    // children is refetched with a new array identity each query resolution;
    // onEmpty is a route-local closure, not itself part of the resolution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, explicit]);

  const select = (id: string) => {
    setChildId(id);
    writeActiveChildId(id);
    setConfirmed(true);
  };

  return {
    childId,
    confirmed,
    needsPicker: Boolean(!explicit && children && children.length > 1 && !confirmed),
    select,
  };
}
