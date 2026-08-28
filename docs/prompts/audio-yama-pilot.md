# Brief — 山 audio pilot (VOICEVOX Nemo)

**Read this before pasting.** VOICEVOX is a local desktop application with a ~1GB download.
Claude Code runs in a sandbox with no egress and no GUI — it **cannot install or run
VOICEVOX**, exactly as it could not reach mext.go.jp. Do not let it discover this over a
session.

So the work splits:

| Runs in Claude Code's sandbox | Runs on your Mac |
|---|---|
| Doc updates, manifest schema, generation script, verification tooling, reviewer instructions | Installing VOICEVOX + Nemo, running the script, producing the audio |

Claude Code writes a script that talks to the VOICEVOX engine's **local HTTP API** (the
desktop app exposes one, conventionally on `localhost:50021` — have it confirm the port
against the installed version rather than hard-coding on faith). You run that script on the
Mac with the app open. The files land on your machine; you commit them.

---

## Paste this

> Read `docs/licenses.md` (Audio — D16, revised 2026-08-26) and `docs/decisions.md` D16
> before anything else. The audio vendor has changed: **VOICEVOX with the VOICEVOX Nemo voice
> library, generated locally, self-hosted.** The prior xAI TTS decision is withdrawn — do not
> use it, do not request or store an `XAI_API_KEY`. Branch `audio-yama-pilot`.
>
> **You cannot run VOICEVOX.** It is a desktop application and this sandbox has no egress and
> no GUI. Do not attempt to install it, and do not substitute a different TTS to get
> unblocked — that would be the same error as swapping in a third-party kanji dataset. Your
> job is the tooling and the documentation; I run the generation on my Mac.
>
> **Scope: 山 only.** Four or five files, using **only** the taught readings and word surfaces
> already present in the 山 content record. Invent nothing — no new readings, no new words, no
> new teaching surfaces. Report the exact set you selected and why, before generating anything.
>
> **1 — Docs.** The D16 and licence-register changes are already written; verify they are
> present and consistent, and fix anything stale. The required credit token is `VOICEVOX:Nemo`
> reproduced **verbatim** — the parent-facing line may wrap it as 「音声：VOICEVOX:Nemo」 but the
> token is not paraphrased. Archive dated copies of both terms pages under
> `assets/audio-review/yama-pilot/terms/`.
>
> **2 — Manifest schema.** Implement the field list in `docs/licenses.md` under "Batch manifest".
> Pay particular attention to `audio_query`: store the **complete AudioQuery JSON** returned by
> the engine before synthesis, per file. A native reviewer's accent correction lives in that
> structure and nowhere else; parameters alone will not reproduce it. Omitting it means a
> future engine upgrade forces a re-review of every file instead of a diff.
>
> **3 — Generation script.** `scripts/audio/generate-pilot.mjs`, talking to the local VOICEVOX
> HTTP API: `POST /audio_query` then `POST /synthesis`. It must (a) fail loudly if the engine
> is unreachable rather than falling back to anything, (b) record engine and core versions
> from the API, (c) write the manifest with SHA-256 per file, (d) be re-runnable from a saved
> AudioQuery so a corrected accent regenerates exactly.
>
> Generation parameters: pin one Nemo speaker (record `speaker_name`, `speaker_id`, and the CV
> credited by VOICEVOX), a stable clear voice suited to elementary learners — not comedic, not
> stylised, not markedly adult. Set `speedScale` slightly below 1.0 and record it; the listener
> is six.
>
> **4 — Output location.** `assets/audio-review/yama-pilot/` with `manifest.json`. This path is
> **outside the child runtime**. Do not wire audio into the 山 ride. Do not flip any
> `audio_pending` item to teach-ready. Add a gate check or test asserting that nothing under
> `assets/audio-review/` can be referenced by a content record — the review directory must be
> structurally incapable of reaching a child.
>
> **5 — Reviewer instructions.** `assets/audio-review/yama-pilot/REVIEW.md`, written **in
> Japanese**, for a native speaker who is not a developer. It must state plainly that **word
> surfaces and citation readings are judged differently**: a citation reading needs only to be
> clear and neutral, while a word surface must have **correct pitch accent**, checked against a
> reference (NHK 日本語発音アクセント新辞典 or OJAD) rather than against impression. Give the
> reviewer a simple pass/fail per file plus a free-text field, and tell them explicitly that
> "sounds fine" is not the standard being asked for.
>
> **Do not touch** the Welcome Screen, M4, M5, the engine, or the content gate beyond the
> assertion in step 4.
>
> **Report:** the selected readings and surfaces with your reasoning, the filenames, the
> manifest, the exact commands I run on my Mac, the speaker details, and the docs diff.

---

## After the review passes

Three separate decisions, in order, none automatic: move the files into the production asset
path; enable the speaker button for 山; generate the Grade 1 batch. Each is mine to authorise.
If the pilot's accent is wrong, we learn it on five files rather than eighty — which is the
entire reason the pilot exists.
