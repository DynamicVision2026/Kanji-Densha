#!/usr/bin/env node
// Production auth-env fallback gate (docs/reviews/remediation-plan.md R1).
//
// The defect: `auth/server.ts` fell back to `previewAuthSecret()` /
// `env("DATABASE_URL")` even under `NODE_ENV=production`, so every Cloud Run
// instance signed sessions with its own random secret and could silently run
// on in-memory PGLite. The fix wraps each of these vars in
// `requiredInProduction(name, ...)`, which throws at import time when
// `NODE_ENV=production` and the var is unset, PLUS a container-level guard
// (`apps/web/scripts/assert-production-env.mjs`, wired into the Dockerfile's
// CMD) that crashes the process before it ever binds a port — the
// module-level throw alone does not do this, because Nitro imports
// `auth/server.ts` lazily, on the first `/api/auth/*` request, not at
// startup (verified empirically; see the R1 PR).
//
// `BETTER_AUTH_URL` and `GROK_AUTH_CLIENT_ID`/`GROK_AUTH_CLIENT_SECRET` were
// audited for the same rule and deliberately left soft — see the R1 audit
// notes in auth/server.ts and the R1 PR description for why. This gate does
// not cover them; extending it is future work if that audit's ruling changes.
//
// This is a deliberately blunt textual gate, in the same spirit as
// check-engine-purity.mjs: if either half of the fix is quietly reverted —
// a var goes back to a bare `env(...)` fallback, or the Dockerfile stops
// running the startup guard — this fails loudly instead of waiting for the
// next incident report.
import { readFileSync } from 'node:fs';

const AUTH_SERVER = 'apps/web/src/lib/auth/server.ts';
const GUARD_SCRIPT = 'apps/web/scripts/assert-production-env.mjs';
const DOCKERFILE = 'Dockerfile';

// Vars that must never have an unconditional fallback in production.
const REQUIRED_IN_PRODUCTION = ['BETTER_AUTH_SECRET', 'DATABASE_URL'];

const problems = [];

// --- Check 1: auth/server.ts guards each var via requiredInProduction ----
let authServerSrc = '';
try {
  authServerSrc = readFileSync(AUTH_SERVER, 'utf8');
} catch (err) {
  problems.push(`${AUTH_SERVER}: could not read — ${err.message}`);
}

if (authServerSrc) {
  if (!/function requiredInProduction\(/.test(authServerSrc)) {
    problems.push(
      `${AUTH_SERVER}: no \`requiredInProduction\` helper found — R1's production fail-fast has been removed.`,
    );
  }
  for (const name of REQUIRED_IN_PRODUCTION) {
    const guarded = new RegExp(`requiredInProduction\\(\\s*["']${name}["']`).test(authServerSrc);
    if (!guarded) {
      problems.push(
        `${AUTH_SERVER}: "${name}" is not read via requiredInProduction(...) — a production ` +
          'process could silently fall back to a preview/dev default again (R1).',
      );
      continue;
    }
    // A bare `env("NAME")` read outside the requiredInProduction call itself
    // (which internally does read via env()) would reintroduce a second,
    // unguarded path to the same var.
    const bareReads = authServerSrc.match(new RegExp(`env\\(\\s*["']${name}["']\\s*\\)`, 'g')) ?? [];
    if (bareReads.length > 1) {
      problems.push(
        `${AUTH_SERVER}: "${name}" is read via env(...) ${bareReads.length} times — expected exactly ` +
          'one, inside requiredInProduction. A second bare read is a second, unguarded fallback path.',
      );
    }
  }
}

// --- Check 2: the container-level startup guard exists and lists the same
// vars, independent of whether auth/server.ts's module ever gets imported.
let guardSrc = '';
try {
  guardSrc = readFileSync(GUARD_SCRIPT, 'utf8');
} catch (err) {
  problems.push(`${GUARD_SCRIPT}: could not read — ${err.message} (R1's startup guard is missing).`);
}

if (guardSrc) {
  if (!/NODE_ENV\s*!==\s*["']production["']|NODE_ENV\s*===\s*["']production["']/.test(guardSrc)) {
    problems.push(`${GUARD_SCRIPT}: does not appear to branch on NODE_ENV=production.`);
  }
  if (!/process\.exit\(1\)/.test(guardSrc)) {
    problems.push(`${GUARD_SCRIPT}: does not appear to exit non-zero on a missing var.`);
  }
  for (const name of REQUIRED_IN_PRODUCTION) {
    if (!guardSrc.includes(name)) {
      problems.push(`${GUARD_SCRIPT}: does not check "${name}".`);
    }
  }
}

// --- Check 3: the Dockerfile actually runs the guard before the server ---
let dockerfileSrc = '';
try {
  dockerfileSrc = readFileSync(DOCKERFILE, 'utf8');
} catch (err) {
  problems.push(`${DOCKERFILE}: could not read — ${err.message}`);
}

if (dockerfileSrc) {
  const cmdLine = dockerfileSrc.split('\n').find((line) => line.trim().startsWith('CMD'));
  if (!cmdLine || !cmdLine.includes('assert-production-env.mjs')) {
    problems.push(
      `${DOCKERFILE}: CMD does not run scripts/assert-production-env.mjs — a misconfigured ` +
        'container would bind the port and pass Cloud Run\'s health check before finding out (R1).',
    );
  }
}

if (problems.length > 0) {
  console.error('✗ production env-fallback gate FAILED:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} violation(s). See docs/reviews/remediation-plan.md R1.`);
  process.exit(1);
}

console.log('✓ production env-fallback gate passed (auth/server.ts, startup guard, Dockerfile CMD).');
