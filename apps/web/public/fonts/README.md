# Self-hosted Noto Sans JP subset

These two files are a **subset** of Google Fonts' Noto Sans JP (OFL-1.1,
credited on the parent licence page — see `docs/licenses.md`), cut down to
only the glyphs `apps/web` actually displays. The full family ships tens of
thousands of CJK glyphs; this app needs 247. Subsetting is what keeps a
"just Japanese text" font from costing several megabytes on a phone.

- `NotoSansJP-Subset-Regular.woff2` — weight 400
- `NotoSansJP-Subset-Bold.woff2` — weight 700

Referenced via `@font-face` in `apps/web/src/styles/app.css` as the family
`"Noto Sans JP Subset"`.

## Source

Noto Sans JP v56, `Regular` and `Bold` static TTFs, downloaded from Google
Fonts (`https://fonts.google.com/noto/specimen/Noto+Sans+JP`).

## What's included

Every character this app can put on screen, from two places:

1. **Source code** — every kana/kanji/punctuation literal in `apps/web/src/**/*.{ts,tsx}`
   (UI copy: button labels, prompts, `ARRIVAL_COPY`, etc).
2. **Published content data** — every displayable text field across all
   twenty Grade-1 characters in `content-dist/g1.json` (readings, surfaces,
   meaning glosses, item prompts and choices, `stroke_order` labels) — not
   just 山. A first pass that scanned source code alone missed characters
   like `サ`, which only appears inside content *data* (山's reading サン),
   never as a source-code literal. Scanning the full published dataset
   avoids that gap reappearing for the next character or the next piece of
   copy, and costs nothing — content-dist is already committed and small.

Plus the ASCII range actually needed (Latin letters/digits/punctuation used
in the codebase, e.g. for `console` output and any Latin punctuation in
copy).

Result: 247 unique characters in the current subset (see `subset-chars.txt`
in this repo's build notes, or regenerate the list per the steps below).

## Regenerating

Needed whenever new UI copy or new published content introduces a character
not already in the subset (a build using a stale subset will silently fall
back to the browser's system font for the missing glyph — no error, just a
visual seam, so re-run this after adding characters and check the app by eye).

Requires `fonttools` (for `pyftsubset`) and `brotli`:

```sh
pip install fonttools brotli
```

1. **Collect the character set.** From the repo root:

   ```sh
   python3 - <<'PY'
   import json, re, pathlib

   chars = set()

   # ASCII/punctuation floor + kana/kanji actually used in source.
   for path in pathlib.Path("apps/web/src").rglob("*.ts*"):
       chars.update(path.read_text(encoding="utf-8"))

   # Every displayable text field in the published content this app ships.
   g1 = json.loads(pathlib.Path("content-dist/g1.json").read_text(encoding="utf-8"))

   def walk(node):
       if isinstance(node, str):
           chars.update(node)
       elif isinstance(node, dict):
           for v in node.values():
               walk(v)
       elif isinstance(node, list):
           for v in node:
               walk(v)

   walk(g1)

   # Keep it to displayable characters — drop control chars, keep space.
   printable = sorted(c for c in chars if c == " " or c.isprintable())
   pathlib.Path("/tmp/subset-chars.txt").write_text("".join(printable), encoding="utf-8")
   print(len(printable), "characters")
   PY
   ```

2. **Download the full-family source TTFs** (Regular and Bold) from Google
   Fonts and note their paths — these are not checked into this repo.

3. **Subset each weight**, targeting the character file from step 1:

   ```sh
   pyftsubset NotoSansJP-Regular.ttf \
     --unicodes-file=/tmp/subset-chars.txt \
     --flavor=woff2 \
     --output-file=NotoSansJP-Subset-Regular.woff2 \
     --layout-features='' --no-hinting --desubroutinize

   pyftsubset NotoSansJP-Bold.ttf \
     --unicodes-file=/tmp/subset-chars.txt \
     --flavor=woff2 \
     --output-file=NotoSansJP-Subset-Bold.woff2 \
     --layout-features='' --no-hinting --desubroutinize
   ```

   (`--unicodes-file` takes a file of literal characters, not codepoint
   ranges — `pyftsubset` reads the raw text and subsets to whatever
   characters appear in it.)

4. **Verify nothing is missing** before replacing the committed files:

   ```sh
   python3 - <<'PY'
   from fontTools.ttLib import TTFont
   import pathlib

   wanted = set(pathlib.Path("/tmp/subset-chars.txt").read_text(encoding="utf-8"))
   font = TTFont("NotoSansJP-Subset-Regular.woff2")
   cmap = font.getBestCmap()
   have = {chr(cp) for cp in cmap}
   missing = wanted - have
   print("missing:", "none - all present" if not missing else missing)
   print("glyph count:", len(cmap))
   PY
   ```

5. Copy both `.woff2` files into this directory, replacing the existing
   ones. Rebuild (`pnpm --filter @kanji-densha/web build`) and spot-check
   the app — a missing glyph shows as the system font's version of that
   character (a font mismatch, not a crash), which reads as "off" but not
   as broken.

## Why self-hosted, not Google Fonts' CDN

D11 requires the UI font be a real, self-hosted asset rather than an
external CDN dependency — no runtime fetch to `fonts.googleapis.com`, no
third-party request on a child's device, no dependency on that CDN being
reachable at all (the shape of this whole app assumes it can work offline
as a PWA).
