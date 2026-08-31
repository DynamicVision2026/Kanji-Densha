#!/usr/bin/env node
// Echo-eligibility single-source gate (docs/reviews/remediation-plan.md R2).
//
// The defect: `legacy-progress-adapter.ts` re-derived the MR-5.2/5.3 echo
// due-time formula itself, and got the units wrong — `almostAt` is
// hours-since-epoch everywhere in the engine, but the adapter treated it as
// an epoch-millisecond timestamp and added a millisecond-denominated delay
// to it, landing the "return date" a few hours after 1970-01-01 instead of
// a real future date. `packages/engine`'s `nextEchoEligibleAtHours` is now
// the ONE place that formula lives; every other caller imports it rather
// than re-deriving it.
//
// This gate makes a second implementation structurally impossible rather
// than merely absent: nothing outside `packages/engine` may combine
// `echoFirstDelayHours` or `echoSecondDelayHours` with an arithmetic
// operator. Referencing the field NAME elsewhere (a params object literal, a
// type declaration, a spec-value assertion) is fine and expected — only
// doing arithmetic with it outside the engine is forbidden.
//
// Deliberately blunt, in the same spirit as check-engine-purity.mjs: comment
// lines are skipped (this repo's docstrings describe the formula in prose,
// e.g. session-stub.ts, and that is not a second implementation), but any
// non-comment line combining the token with `+`, `-`, `*`, or `/` fails loudly.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const EXEMPT_PREFIXES = ['packages/engine/', 'node_modules/'];
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.output', '.git', 'coverage']);
const FILE_EXTENSIONS = ['.ts', '.tsx'];

const TOKEN = /echo(?:First|Second)DelayHours\b/;
const ARITHMETIC_BEFORE = /[+\-*/]\s*(?:[\w.]+\s*\.\s*)?echo(?:First|Second)DelayHours\b/;
const ARITHMETIC_AFTER = /echo(?:First|Second)DelayHours\b\s*[+\-*/]/;

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('/**') || t.startsWith('/*') || t.startsWith('*');
}

function walk(dir) {
  let files = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      files = files.concat(walk(p));
    } else if (FILE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      files.push(p);
    }
  }
  return files;
}

const problems = [];
const allFiles = walk(ROOT);

for (const absPath of allFiles) {
  const relPath = relative(ROOT, absPath);
  if (EXEMPT_PREFIXES.some((prefix) => relPath.startsWith(prefix))) continue;

  let content;
  try {
    content = readFileSync(absPath, 'utf8');
  } catch {
    continue;
  }
  if (!TOKEN.test(content)) continue;

  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (!TOKEN.test(line)) return;
    if (isCommentLine(line)) return;
    if (ARITHMETIC_BEFORE.test(line) || ARITHMETIC_AFTER.test(line)) {
      problems.push(
        `${relPath}:${i + 1}: arithmetic on an echo delay param outside packages/engine — ` +
          `this is a second echo-eligibility implementation (R2). Import ` +
          `nextEchoEligibleAtHours from @kanji-densha/engine instead. ${line.trim()}`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error('✗ echo-eligibility single-source gate FAILED:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} violation(s). See docs/reviews/remediation-plan.md R2.`);
  process.exit(1);
}

console.log(`✓ echo-eligibility single-source gate passed (${allFiles.length} file(s) scanned).`);
