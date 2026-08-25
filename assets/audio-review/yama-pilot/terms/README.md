# Terms archive — VOICEVOX + VOICEVOX Nemo

Claude Code's sandbox has no general internet egress (it can reach a small fixed allowlist —
package registries, the Anthropic API — nothing else), so it cannot fetch these pages itself.
This is the same wall the brief describes for VOICEVOX itself; archiving the terms pages is
part of the "runs on your Mac" half of this pilot.

## What to save here

Two pages, dated copies, referenced by `docs/licenses.md` ("Audio — D16 (revised 2026-08-26)"):

- https://voicevox.hiroshiba.jp/term/
- https://voicevox.hiroshiba.jp/nemo/term/

## How

Simplest: open each URL in a browser, "Save Page As... → Webpage, Complete" (or just
"Save as PDF"), and drop the result in this folder. Or from a terminal with real internet
access:

```sh
curl -sS -A "Mozilla/5.0" "https://voicevox.hiroshiba.jp/term/" \
  -o "assets/audio-review/yama-pilot/terms/voicevox-term-$(date +%Y-%m-%d).html"
curl -sS -A "Mozilla/5.0" "https://voicevox.hiroshiba.jp/nemo/term/" \
  -o "assets/audio-review/yama-pilot/terms/voicevox-nemo-term-$(date +%Y-%m-%d).html"
```

Name the files with the date you saved them (`YYYY-MM-DD`), matching `manifest.json`'s
`terms_checked_date` for that batch. If the terms have visibly changed since **2026-08-26**
(the date recorded in `docs/licenses.md`), stop and update that doc first — the register's
verification rule applies here same as anywhere else in it.
