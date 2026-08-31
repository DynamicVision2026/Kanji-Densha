import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * routing.md §4 — "is the new version actually live" as one URL, not a
 * screenshot argument. sha/buildTime come from build-info.json
 * (scripts/write-build-info.mjs, run on the CI runner before the Docker
 * build starts — .git is dockerignored, so it cannot be computed inside the
 * container itself). Vite copies apps/web/public/* into .output/public/
 * verbatim, a fixed sibling of the built server module regardless of the
 * server's working directory at runtime, so this reads relative to
 * import.meta.url rather than process.cwd().
 */
function readBuildInfo(): { sha: string; shortSha: string; buildTime: string } {
  try {
    const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public");
    const raw = readFileSync(join(publicDir, "build-info.json"), "utf8");
    const parsed = JSON.parse(raw) as { sha?: unknown; shortSha?: unknown; buildTime?: unknown };
    return {
      sha: typeof parsed.sha === "string" ? parsed.sha : "unknown",
      shortSha: typeof parsed.shortSha === "string" ? parsed.shortSha : "unknown",
      buildTime: typeof parsed.buildTime === "string" ? parsed.buildTime : "unknown",
    };
  } catch {
    return { sha: "unknown", shortSha: "unknown", buildTime: "unknown" };
  }
}

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ status: "ok", ...readBuildInfo() }), {
          headers: { "content-type": "application/json" },
        }),
    },
  },
});
