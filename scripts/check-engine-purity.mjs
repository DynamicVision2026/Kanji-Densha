#!/usr/bin/env node
// Engine purity gate (CLAUDE.md I6, architecture.md §1).
//
// Two checks, both blocking:
//   1. packages/engine/package.json declares an EMPTY `dependencies` object.
//      The engine is zero-dependency, permanently.
//   2. No forbidden token appears anywhere under packages/engine/src. Time and
//      randomness must arrive *inside the event*, never be read from a clock or
//      an RNG; the engine does no I/O and pulls in no module system.
//
// This is a deliberately blunt textual gate. It is meant to fail loudly and be
// impossible to satisfy by accident. If a legitimate need ever collides with
// it, that is an escalation to docs/open-questions.md, not a quiet exception.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE_DIR = 'packages/engine';
const SRC_DIR = join(ENGINE_DIR, 'src');

// Forbidden substrings. Ordered longest-first only for readable reporting.
const FORBIDDEN = ['Math.random', 'Date.now', 'Date.', 'fetch', 'process.', 'require('];

const problems = [];

// --- Check 1: empty dependencies -----------------------------------------
try {
  const pkg = JSON.parse(readFileSync(join(ENGINE_DIR, 'package.json'), 'utf8'));
  const deps = pkg.dependencies ?? {};
  const n = Object.keys(deps).length;
  if (n > 0) {
    problems.push(
      `${ENGINE_DIR}/package.json: "dependencies" must be empty (found ${n}: ${Object.keys(deps).join(', ')}). The engine is zero-dependency (I6).`,
    );
  }
} catch (err) {
  problems.push(`${ENGINE_DIR}/package.json: could not read/parse — ${err.message}`);
}

// --- Check 2: forbidden tokens in src ------------------------------------
function walk(dir) {
  let files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files = files.concat(walk(p));
    else if (p.endsWith('.ts')) files.push(p);
  }
  return files;
}

let srcFiles = [];
try {
  srcFiles = walk(SRC_DIR);
} catch (err) {
  problems.push(`${SRC_DIR}: could not scan — ${err.message}`);
}

for (const file of srcFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const tok of FORBIDDEN) {
      const col = line.indexOf(tok);
      if (col !== -1) {
        problems.push(`${file}:${i + 1}:${col + 1}: forbidden token "${tok}" — the engine must be pure (I6). ${line.trim()}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error('✗ engine purity gate FAILED:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} violation(s). The engine stays pure and zero-dependency.`);
  process.exit(1);
}

console.log(`✓ engine purity gate passed (${srcFiles.length} file(s) scanned, dependencies empty).`);
