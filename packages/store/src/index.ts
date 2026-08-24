// packages/store — the ProgressStore boundary (architecture §3). Both the
// guest LocalStore and the (M7) authenticated RemoteStore call the SAME
// evaluateProgress (I5); `apply` is the only write path.
export type { ProgressStore, SessionSummary, ContentLookup, StorageLike } from './types.js';
export { LocalStore } from './local-store.js';
