# 山 audio pilot — running the generation script

This is the "runs on your Mac" half of the pilot described in the brief. Claude Code's sandbox
has no GUI and no general internet egress, so it cannot install or run VOICEVOX — see
`docs/decisions.md` D16 and `docs/licenses.md` "Audio — D16 (revised 2026-08-26)" for why, and
do not substitute a different TTS to get around that; that withdraws the actual decision, not
just the blocker.

## Prerequisites

1. **VOICEVOX desktop app installed and open**, with the **Nemo** voice library added
   (VOICEVOX ships several voice libraries separately — Nemo is installed on top of the base
   app). The app must stay open while you run the script; its HTTP API only exists while the
   app is running.
2. **Node.js** (any reasonably recent version — the script uses only `fetch`, `node:crypto`,
   and `node:fs`, no `npm install` required). Run it from the repo root or anywhere; it locates
   the repo by its own file location.

## Commands

From the repo root:

```sh
# 1. Find Nemo's speaker id — VOICEVOX assigns ids per voice+style, not per app install.
node scripts/audio/generate-pilot.mjs --list-speakers

# 2. Generate all four pilot files (pick Nemo's id from step 1's output).
node scripts/audio/generate-pilot.mjs --speaker-id=<id-from-step-1>

# Optional: record the credited voice actor (CV) name if VOICEVOX's credit page names one —
# generation_params.cv_name is left blank otherwise, with a reminder printed at the end.
node scripts/audio/generate-pilot.mjs --speaker-id=<id> --cv-name="<name>"

# Optional: if the engine isn't on the default port (127.0.0.1:50021).
node scripts/audio/generate-pilot.mjs --speaker-id=<id> --host=http://127.0.0.1:<port>
```

This writes four `.wav` files and `manifest.json` into `assets/audio-review/yama-pilot/` —
**outside the child runtime**; nothing here is wired into the 山 ride, and nothing flips
`audio_pending` to teach-ready. That happens later, and only after review (see "After the
review passes" in the brief).

## After generating

1. Archive the terms pages — see `assets/audio-review/yama-pilot/terms/README.md` (the script
   can't do this either, same egress restriction).
2. Send `assets/audio-review/yama-pilot/` to a native-speaker reviewer with `REVIEW.md`.
3. Commit the four `.wav` files, `manifest.json`, and the archived terms pages. This tooling
   commits the review artifacts; it does not commit itself to anything beyond the review stage.

## If a reviewer corrects an accent

Don't regenerate from scratch — that discards their correction along with everything else.
Instead:

1. Open `manifest.json`, find the entry for the file in question, copy its `audio_query`
   object to a new file (e.g. `/tmp/corrected.json`), and edit the specific field the reviewer
   flagged (most often an `accent` value inside `accent_phrases`).
2. Re-run with `--only` and `--from-query`:

   ```sh
   node scripts/audio/generate-pilot.mjs --speaker-id=<id> --only=<taught_reading_id-or-word_surface_id> --from-query=/tmp/corrected.json
   ```

   This skips `/audio_query` entirely and synthesizes directly from your edited query, so the
   correction is exact — not a hope that re-generating from the same text produces the same
   accent decision the engine made last time.
3. The corresponding manifest entry is replaced in place (same file, not a duplicate), and the
   file's `sha256` changes to reflect the new audio.

## What this script will not do

- Fall back to a different engine, or synthesize anything if VOICEVOX is unreachable — it
  fails loudly instead, with the reason.
- Invent readings or surfaces beyond what `content-dist/g1.json`'s own 山 record already
  declares (`san_on`, `yama_kun`, `yama_1`, `kazan_1`) — that set is fixed, not a starting
  point to extend from.
- Write audio anywhere but `assets/audio-review/yama-pilot/`, or touch any content record —
  `packages/content-schema` is what makes that directory structurally unreachable from the
  child runtime (see the audio-path-traversal fixture in `fixtures/bad-content/`), not this
  script's discipline about where it writes.
