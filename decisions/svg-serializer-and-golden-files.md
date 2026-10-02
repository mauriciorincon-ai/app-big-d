# SVG serializer and golden files: own canonical serializer, hashes on raw bytes

**Status:** accepted · **Date:** 2026-09-27 · **Sprint:** S1 (Atlas de Fabric)

## Context

G1 of the diagramador contract requires the **same SVG byte for byte** for the same map, grammar,
language, versions and options — in Node and in Chromium, Firefox and WebKit, on Linux and macOS. D8
forbids SVGO and formatters (the research saw SVGO merge node rects, drop ids and roles and orphan
`aria-labelledby` targets). DOM serializers differ across engines in attribute order and number
printing, and `String(x)` of a non-integer double is not stable enough to promise bytes.

## Decision

1. **Own serializer** (`packages/diagramador/src/svg/`): an element tree built by code, attributes in a
   fixed order per element type, UTF-8 without BOM, LF, exactly one trailing newline, no dates or
   versions inside the SVG (they go in a manifest next to it).
2. **Numbers from quantized integers.** Geometry is integer units; anything finer is carried as integer
   tenths and printed by one canonical function (`-0` normalized). `Math` functions outside the exact
   set, `**`, `Intl`, `toLocale*`, `localeCompare`, `Date` and text measurement APIs are banned by the
   G2 ESLint rule in the package (demonstrated red).
3. **Ids derived from the model** with a per-SVG namespace (`sujeto-vista-idioma`) so several canvases
   on one page never repeat `<defs>` ids (D8, D12, F-010). Roles per D9; activatable nodes keep
   `graphics-symbol img` and add `aria-describedby` with the activation hint (pays A-29).
4. **One SVG per language**, with `lang`, `<title>` and `<desc>` in that language.
5. **Golden files by hash**: `packages/diagramador/test/golden/*.svg` plus a `SHA256SUMS` file; the
   test compares SHA-256 of raw bytes (Vitest file snapshots normalize line endings, so they are not
   used for G1). `.gitattributes` marks the goldens `-text`; `.prettierignore` excludes them. An
   intentional change regenerates them with a script and shows up in the diff for review.
6. **Cross-engine check without a public route**: the package is bundled with esbuild into a blank
   page in each browser, `toSVG` runs there, `crypto.subtle` hashes the output, and the hash must equal
   Node's (`SHA256SUMS`). This runs in the `diagramador` CI job on `ubuntu-latest` and `macos-latest`.

## Consequences

- Gains: byte identity is checkable and cheap; a failing hash names the file, map, view and language.
- Costs: every visual change is an explicit golden update; the canonical number function is the only
  way to print numbers in the package (reviewed in the audit).
- Failures found go to the contract's failure registry via the sprint summary (symptom, cause, rule,
  carnada).
