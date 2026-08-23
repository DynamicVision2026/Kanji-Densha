// packages/store — the ProgressStore boundary (architecture.md §3). Both the
// guest LocalStore and the authenticated RemoteStore call the SAME
// evaluateProgress (I5); `apply` is the only write path. M0 placeholder only;
// the interface and adapters arrive with M3 (LocalStore) and M7 (RemoteStore).
export const STORE_PLACEHOLDER = 'store' as const;
