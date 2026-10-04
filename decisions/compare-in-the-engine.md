# Side by side in the engine, pre-rendered for the static export

**Status:** accepted · **Date:** 2026-10-04 · **Sprint:** S2 (Databricks and Snowflake, side by side)

## Context

`compare` (CONTRATO § 4.4) was the only view of the contract without code. S2 had to build it in the package and
put it in the product at `/[lang]/comparar`.

- **The requirements.** N platforms, one row each, with every band in the same column for all of them (G5). Three
  at a time on a wide screen, a declared constant of the view that paginates beyond; on a phone, one band at a time
  with every chosen platform stacked. The components shown "in the
  same diagram".
- **The settled shape.** Look M1 (2026-10-02) settled what "in the same diagram" means: a single button at the top
  right of the diagram frame expands every band's components and collapses them again, without moving the
  columns.
- **The constraint.** The app is a static export with no server. SPRINT_002 asks that pagination and the platform
  selector never re-render the SVG.

## Decision

1. **`compare` lives in the package.**
   - Two grids: blocks, 118 u per column; components, 152 u.
   - `levelByBand` expands bands in place.
   - `part: "header" | "rows"` splits the band header from the rows.
   - Rows are ordered by `sujeto_id`, and their ids carry a per-map prefix (D12).
   - `marks` draws the difference pills of § 4.7.
   - A property test proves that each platform's row drawn alone is byte for byte its row in the comparison of all
     platforms, apart from a translation. This is what lets the product draw rows independently.
2. **The product pre-renders, the browser only toggles.**
   - In the build, each published platform gets two row variants: its blocks (n1) and every band expanded (n2). The
     band header is one more SVG.
   - The button flips `data-todo` on the canvas, and CSS shows one variant or the other.
   - The engine never runs in the browser for this page.
3. **Selection and page live in the URL** (`?plataformas=a,b&pagina=2`; a clean URL means every platform, page 1).
   - A pre-paint inline script, the same pattern as the theme script, writes two attributes on `<html>`. CSS
     generated per platform shows the matching rows, so there is no layout shift.
   - The React tree never depends on the URL. The component reads it with `useSyncExternalStore` (server snapshot:
     empty) and writes it with `history.replaceState`.
   - The language switch keeps the query.
4. **`POR_PAGINA = 3` is the view's declared constant.** The engine takes `n` and `page` from the consumer and
   never assumes a count.
5. **Below 900 px the page is HTML, not SVG.**
   - Band tabs, one list per platform, and one disclosure per block holding `toBlockCards`.
   - It groups exactly as the engine drew the n1 row, read from that row's boxes.

## Alternatives rejected

- **Run the engine in the browser and redraw on every change.** It ships the layout code to every visitor. It
  redraws after hydration (layout shift) and breaks the "no re-render" requirement.
- **Pre-render every state** (selection × page × expanded). The weight grows combinatorially; we measured about
  350 KB for three platforms against about 32 KB per platform for two variants.
- **The per-band toggle and a "blocks / components" switch from the mockup.** M1 replaced both with a single button.

## Gates

- **Package.**
  - Golden files for compare: three maps × two languages × {blocks, page 2, collapsed grid, one band, all bands}
    and the diff, plus determinism in three browsers (job `diagramador`, Linux and macOS).
  - fast-check properties: G5 across N maps, invariance to map order, `levelByBand` never moves a column, and
    independent row = row of the whole comparison.
  - D11 = 0 at four ages. V16 also draws the comparison.
- **App.**
  - `tests/unit/lado.test.ts`: URL rule and pre-paint script parity, run in `vm` with random queries; N platforms
    with no literal; reordering the data changes no byte.
  - `tests/e2e/lado.spec.ts` (wide and phone), G11 on the wide comparison in three engines, reduced motion with
    the same tree, axe in both themes, CSP across soft navigation.
  - The capture pass with interaction.
- **Measured** (Lighthouse 13.4.1, median of 3, local, 2026-10-04, four platforms): `/es/comparar` LCP 2783 ms, CLS 0,
  TBT 11 ms, 469 KB (phase 2, two published platforms: 2765 ms, 401 KB).

## Consequences

The page costs two SVGs per platform in HTML. Adding a platform adds data files and two rows, no code. Several
pieces are extensions of the contract and go to the summary's "Amendments": independent rows, `part`, the
`variante` attribute, and the URL state. `toCompareCSS`, planned in D-S2-07, was not needed: after M1 one CSS rule
swaps the variants.
