// packages/content-build — the CLI that validates, gates, and emits published
// content bundles (architecture.md §2.2: parse -> schema validate ->
// cross-reference -> gate -> emit). M0 placeholder only; the real pipeline and
// the offline LLM factory arrive in M2. Nothing imports this at runtime.
export const CONTENT_BUILD_PLACEHOLDER = 'content-build' as const;
