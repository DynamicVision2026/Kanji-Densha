// A browser-safe StorageLike for LocalStore. TanStack Start SSRs this page;
// `window.localStorage` does not exist on the server. The SSR pass never
// needs real persistence (the ride only actually happens after hydration on
// the child's phone), so an in-memory fallback during SSR is harmless — it is
// discarded, never read back.
import type { StorageLike } from '@kanji-densha/store';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

export function getBrowserStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return memoryStorage();
}

/** Demo copy makes locality explicit (spec §2): progress lives on this device. */
export const GUEST_CHILD_ID = 'guest';
