#!/usr/bin/env node
// Routing structural gates (docs/design/routing.md §4). Deliberately blunt
// textual gates, same style and same reason as check-engine-purity.mjs: this
// class of bug (two evaluators, resolver duplication) survived a week
// because it was only ever checked by hand. Manual clicking does not scale;
// these run on every commit instead.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_SRC = "apps/web/src";
const problems = [];

function walk(dir, exts) {
  let files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) files = files.concat(walk(p, exts));
    else if (exts.some((e) => p.endsWith(e))) files.push(p);
  }
  return files;
}

const srcFiles = walk(WEB_SRC, [".ts", ".tsx"]);

// --- Gate 1: no status assignment outside packages/engine ------------------
// routing.md §1: demo-progress.ts's seed function and the dev-only
// practice-card-states.tsx review gallery are the two named, accepted
// exceptions — both construct example/seed CharacterProgress by hand rather
// than deriving status from evaluateProgress, and both say so in their own
// comments. Nothing else may.
const STATUS_ALLOWLIST = new Set([
  join(WEB_SRC, "lib/demo-progress.ts"),
  join(WEB_SRC, "routes/dev/practice-card-states.tsx"),
]);
// Matches `status: "perfect"` / `status = "almost"` etc. — a single `:` or
// `=` immediately before the quote, so `status === "perfect"` (a read, not
// an assignment) does not match: the extra `=`/`!` breaks the `\s*"` that
// must follow directly. Double-quoted only, on purpose: this codebase's own
// TS/TSX always double-quotes string literals (Prettier), while the raw SQL
// inside `sql\`...\`` tagged templates always single-quotes
// (`status = 'perfect'`) — a column comparison, not a JS assignment, and
// indistinguishable from one by a line-level regex otherwise.
const STATUS_ASSIGN = /\bstatus\s*[:=]\s*"(perfect|almost|fix|lost)"/;
for (const file of srcFiles) {
  if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
  if (STATUS_ALLOWLIST.has(file)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (STATUS_ASSIGN.test(line)) {
      problems.push(
        `${file}:${i + 1}: literal status assignment outside packages/engine — ${line.trim()}`,
      );
    }
  });
}

// --- Gate 2: evaluateProgress has exactly two callers -----------------------
// routing.md §1/§3 step 1: demo-progress.ts (guest) and server/progress.ts
// (account) are the only two files that may score progress; every other
// consumer reads the legacy-progress-adapter.ts projection instead.
const EVAL_ALLOWLIST = new Set([
  join(WEB_SRC, "lib/demo-progress.ts"),
  join(WEB_SRC, "lib/server/progress.ts"),
]);
const IMPORT_EVAL = /import\s*\{[^}]*\bevaluateProgress\b[^}]*\}\s*from\s*["']@kanji-densha\/engine["']/;
for (const file of srcFiles) {
  if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
  if (EVAL_ALLOWLIST.has(file)) continue;
  const text = readFileSync(file, "utf8");
  if (IMPORT_EVAL.test(text)) {
    problems.push(
      `${file}: imports evaluateProgress directly — only demo-progress.ts and server/progress.ts may (I5).`,
    );
  }
}

// --- Gate 3: active-child resolution is importable only by routes ----------
// routing.md §1/§3 step 2: four routes each carried their own drifted copy
// of this resolution before useActiveChild existed. Confirmed by grep that
// no presentational component resolves a child independently — this gate
// keeps that true. lib/active-child.ts itself is exempt (it's the
// definition, not a consumer).
const ACTIVE_CHILD_DEFINITION = join(WEB_SRC, "lib/active-child.ts");
const IMPORT_ACTIVE_CHILD = /from\s*["'](@\/lib\/active-child|\.{1,2}\/(?:lib\/)?active-child)(\.ts)?["']/;
for (const file of srcFiles) {
  if (file === ACTIVE_CHILD_DEFINITION) continue;
  const text = readFileSync(file, "utf8");
  if (!IMPORT_ACTIVE_CHILD.test(text)) continue;
  const rel = relative(WEB_SRC, file);
  if (!rel.startsWith("routes/")) {
    problems.push(
      `${file}: imports active-child.ts from outside routes/ — only a route may resolve a child (routing.md §4). Presentational components must receive childId as a prop.`,
    );
  }
}

// --- Gate 4: route tree matches a checked-in list ---------------------------
// Not yet the post-collapse single tree from routing.md §2 (steps 3 and 5
// are later work) — this locks in TODAY's actual dual-tree inventory, so a
// new/removed/renamed route file is a deliberate edit to this list, not an
// accident. Update CANONICAL_ROUTES when routing.md §3 step 3 or 5 lands.
const CANONICAL_ROUTES = [
  "__root.tsx",
  "api/auth/$.ts",
  "app/catalog.tsx",
  "app/index.tsx",
  "app/kanji.$char.tsx",
  "app/map.tsx",
  "app/mistakes.tsx",
  "app/parent.tsx",
  "app/route.tsx",
  "app/stamps.tsx",
  "app/workshop.tsx",
  "demo/catalog.tsx",
  "demo/index.tsx",
  "demo/kanji.$char.tsx",
  "demo/map.tsx",
  "demo/mistakes.tsx",
  "demo/parent.tsx",
  "demo/stamps.tsx",
  "demo/workshop.tsx",
  "dev/practice-card-states.tsx",
  "health.ts",
  "index.tsx",
  "login.tsx",
  "onboard.tsx",
  "parents.tsx",
];
const ROUTES_DIR = join(WEB_SRC, "routes");
const actualRoutes = walk(ROUTES_DIR, [".ts", ".tsx"])
  .map((p) => relative(ROUTES_DIR, p))
  .sort();
const canonicalSorted = [...CANONICAL_ROUTES].sort();
const added = actualRoutes.filter((r) => !canonicalSorted.includes(r));
const removed = canonicalSorted.filter((r) => !actualRoutes.includes(r));
for (const r of added) {
  problems.push(
    `routes/${r}: new route file not in CANONICAL_ROUTES (scripts/check-routing-invariants.mjs) — a new route is a deliberate edit to that list, not an accident.`,
  );
}
for (const r of removed) {
  problems.push(
    `routes/${r}: listed in CANONICAL_ROUTES but no longer exists — update the list (scripts/check-routing-invariants.mjs).`,
  );
}

// --- Gate 5: any route reading readActiveChildId() must render StationBoard -
// docs/reviews/remediation-plan.md R3: kanji.$char.tsx and mistakes.tsx each
// called readActiveChildId() directly instead of going through
// useActiveChild, so neither ever showed the picker on a multi-profile
// household — one silently landed on whichever child's id happened to be in
// storage, the other showed an infinite skeleton. Gate 3 above forbids a
// *component* from resolving a child; it does not fire here because these
// are routes. This gate is the one that would have caught it: reading the
// raw active-child value directly (not through the hook, which already
// carries its own needsPicker/StationBoard contract) is only safe if the
// same file also renders StationBoard for the multi-profile case.
const READ_ACTIVE_CHILD_DIRECT = /\breadActiveChildId\s*\(/;
for (const file of srcFiles) {
  if (file === ACTIVE_CHILD_DEFINITION) continue;
  const text = readFileSync(file, "utf8");
  if (!READ_ACTIVE_CHILD_DIRECT.test(text)) continue;
  if (!text.includes("StationBoard")) {
    problems.push(
      `${file}: calls readActiveChildId() directly but never renders StationBoard — ` +
        "a multi-profile household gets no picker (R3). Use useActiveChild instead, " +
        "which needsPicker/StationBoard is the contract for.",
    );
  }
}

if (problems.length > 0) {
  console.error("✗ routing invariants gate FAILED:\n");
  for (const p of problems) console.error("  - " + p);
  console.error(`\n${problems.length} violation(s). See docs/design/routing.md §4.`);
  process.exit(1);
}

console.log(`✓ routing invariants gate passed (${srcFiles.length} file(s) scanned, ${actualRoutes.length} routes checked).`);
