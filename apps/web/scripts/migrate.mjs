#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Deliberately NOT wired into `npm run build` (see `package.json` — `build`
 * is `vite build` only). A build step that mutates a database means any
 * build — preview, CI, or a Cloud Build image build with no DB access at
 * all — can migrate production, and a failed migration fails the build
 * instead of the deploy. Run this explicitly as its own deploy step
 * (`npm run db:migrate`) against DATABASE_URL, separate from `build`.
 *
 * Applies pending files in ../migrations to DATABASE_URL. Each file is
 * applied in one transaction and recorded in a `_migrations` table, so it
 * runs once and is safe to re-run.
 *
 * The read is non-recursive, so the opt-in auth schema under migrations/auth/
 * is not applied to an app that never asked for sign-in.
 *
 * DATABASE_URL is required here. Local dev never calls this script — it
 * runs on PGLite instead (see src/lib/db.ts), which migrates itself. The
 * only caller of this file is `npm run db:migrate`, invoked deliberately
 * as its own deploy step, so a missing DATABASE_URL at that point is a
 * real misconfiguration (wrong secret, wrong deploy target), not a
 * legitimate no-op — it fails loudly rather than exiting 0 and letting a
 * skipped migration look like a successful one.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "[migrate] DATABASE_URL is not set. Refusing to silently skip — this script is only ever " +
      "invoked as an explicit deploy step, so a missing DATABASE_URL means the wrong secret or " +
      "the wrong target, not 'use the local PGLite fallback instead'. Set DATABASE_URL and re-run.",
  );
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  // An app with no schema of its own must not pay for a database connection.
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        // pg's simple-query protocol runs a whole multi-statement file at once.
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ROLLBACK fails when the connection died — keep the original error.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  // pg errors carry the context needed to debug a bad SQL file.
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
