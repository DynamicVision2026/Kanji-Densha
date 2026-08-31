#!/usr/bin/env node
// Health-endpoint build metadata (routing.md §4 — "is the new version
// actually live" as one URL, not a screenshot argument).
//
// .git is deliberately excluded from the Docker build context
// (.dockerignore), so the SHA cannot be computed inside the image itself —
// this must run somewhere .git actually exists (a CI runner with a real
// checkout, or a local dev machine) and its output rides through the Docker
// build as an ordinary file under apps/web/public/, which Vite copies
// verbatim into .output/public/.
//
// Never overwrites a file that already exists: the CI step with real git
// access runs first, before `gcloud run deploy --source .` snapshots the
// directory; if this also ran again inside the Docker build stage (it
// doesn't today, but if it ever did), it must not clobber that real SHA
// with "unknown" just because .git isn't there.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO_ROOT, "apps/web/public/build-info.json");

function tryGit(cmd) {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function main() {
  if (existsSync(OUT)) {
    console.log(`[build-info] ${OUT} already exists — leaving it (real git metadata already captured).`);
    return;
  }
  const sha = tryGit("git rev-parse HEAD") ?? "unknown";
  const shortSha = tryGit("git rev-parse --short HEAD") ?? "unknown";
  const buildTime = new Date().toISOString();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ sha, shortSha, buildTime }, null, 2) + "\n");
  console.log(`[build-info] wrote ${OUT}: sha=${shortSha} buildTime=${buildTime}`);
}

main();
