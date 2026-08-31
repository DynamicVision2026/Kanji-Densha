#!/usr/bin/env node
/**
 * R1 (docs/reviews/remediation-plan.md): the container's own startup gate.
 *
 * `src/lib/auth/server.ts` throws when a required-in-production var is
 * missing, but Nitro code-splits routes — nothing imports that module until
 * the first request to `/api/auth/*` arrives (verified empirically: a
 * misconfigured build binds the port, passes a health check, and only 500s
 * on the auth route, forever — see the R1 PR for the before/after transcript,
 * including a dead end where a Nitro startup plugin's import was silently
 * tree-shaken by `"sideEffects": false`). Cloud Run would see that container
 * as healthy.
 *
 * This script is the Dockerfile's actual CMD, run before the server binary
 * (see root Dockerfile). It duplicates only a presence check — never the
 * fallback values or business logic auth/server.ts computes — so there is
 * one source of truth for what each var *is*, and two independent, narrow
 * checks for whether it's *set*.
 *
 * `BETTER_AUTH_URL` and the `GROK_AUTH_*` federation creds were audited for
 * the same rule and deliberately left soft — see the audit notes in
 * auth/server.ts and the R1 PR description for why. This guard does not
 * check them; extending it is future work if that audit's ruling changes.
 */
const REQUIRED_ALWAYS = ["BETTER_AUTH_SECRET", "DATABASE_URL"];

function main() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_ALWAYS.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.error(
      `[assert-production-env] refusing to start: ${missing.join(", ")} ${
        missing.length === 1 ? "is" : "are"
      } required when NODE_ENV=production and must not fall back to a preview/dev ` +
        "default — see docs/reviews/remediation-plan.md R1. Every Cloud Run instance " +
        "otherwise disagrees with every other one (or with its own next redeploy) about " +
        "what this value is.",
    );
    process.exit(1);
  }
}

main();
