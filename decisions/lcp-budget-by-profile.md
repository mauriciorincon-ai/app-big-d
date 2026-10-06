# LCP budget for an app that measures its text with a metrics table

**Status:** accepted · **Date:** 2026-10-02 · **Sprint:** S2 (Databricks and Snowflake, side by side)

## Context

Standard 5 asks for LCP ≤ 2.5 s. Big-D measures every label of its diagrams against a metrics table of the
exact font it serves (contract G15): a fallback font with different advances would make text spill out of its
box. So the fonts load with `font-display: block`, and the largest contentful paint (a text paragraph) waits
for them. S1 measured 2455–2772 ms locally (median of 3, simulated mobile; CI about 130 ms higher), set
`perf-budget.json` to 2900 ms and left a debt for S2: "subset the two woff2 to `cobertura.json`".

Before paying it, S2 read the fonts. The `cmap` of each WOFF2 is **exactly** the ranges in `cobertura.json`:
464 code points for Space Grotesk (35,724 bytes), 432 for JetBrains Mono (47,412 bytes); none extra, none
missing (checked by reading the WOFF2 table directory with Node's brotli, 2026-10-02). The design stage had
already subset them. Subsetting to the coverage saves nothing.

What would save bytes is something else: dropping alternate glyphs and unused GSUB/GPOS features (`aalt`,
`ss01`–`ss05`, `onum`, `frac`, code ligatures), dropping `kern` (but `font-kerning: normal` is set), or
narrowing the variable axes to the weights the CSS uses (Space Grotesk's default moves from 300 to 400, so
the advances would need re-checking). All of it changes the files in `docs/diseno/assets/fuentes/`, which
are read-only for product work, and the G15 chain that requires the mockup, the package copy
(`packages/diagramador/metricas/`, fingerprinted in `CONTRATO.lock`) and the site to serve the same bytes.

Standards v2.17.0 (standard 5) and kit v1.33.0 (rule 23) allow this profile: LCP ≤ 3.0 s **declared by ADR**
for apps that measure text with a metrics table and serve their fonts with `display: block`, with the font
subset as a payable debt.

## Decision

1. **The LCP ceiling for Big-D is 3.0 s, by this ADR.** `perf-budget.json` keeps its 2900 ms budget: the CI
   job asserts it on every PR (median of 3), so the margin stays visible below the ceiling.
2. **The S1 debt "subset the fonts to their coverage" is closed as already paid** (in the design stage), with
   the evidence above.
3. **The deeper reduction is proposed, not done:** a feature-and-axis subset of the two fonts goes to the
   summary's contract amendments and to the design system, because it changes the mockup's fonts, the
   package's fingerprinted copy and possibly the advances in `metricas.json` (golden files would follow).
4. Measured again at the end of S2 (2026-10-04, local, median of 3): `/es/comparar` 2783 ms,
   `/es/atlas/fabric/versiones` 2613 ms, `/es/atlas/fabric` 2478 ms, `/es/atlas/databricks` 2465 ms, and Snowflake,
   the densest map, `/es/atlas/snowflake` 2536 ms and `/en/atlas/snowflake/componentes` 2543 ms. All are under the
   2900 ms budget and the 3.0 s ceiling.

## Consequences

The budget matches the standard for this profile instead of a renegotiated number with no ADR behind it.
The only real lever left is a design decision about the fonts, which is where it belongs.

## Margin against the budget (S3, kit v1.37.0 / v1.39.0)

**Date:** 2026-10-04 · **Sprint:** S3 (phase 0)

Kit v1.37.0 adds `scripts/lighthouse-margen.mjs` after `lhci assert`: it warns (exit 0) when a median sits less
than 10 % under its budget, and asks for the margin to be decided by ADR. The first CI run with it (PR #8, run
37241742843, `lighthouse` job, median of 3, simulated mobile) warned four times, all on LCP:

| URL | LCP median | Margin to the 2900 ms budget | Margin to the 3.0 s ceiling |
|---|---|---|---|
| `/es/atlas/plataforma-ejemplo/recorrido` | 2706 ms | 6.7 % | 9.8 % |
| `/en/atlas/plataforma-ejemplo/recorrido` | 2709 ms | 6.6 % | 9.7 % |
| `/es/atlas/fabric/recorrido` | 2710 ms | 6.5 % | 9.7 % |
| `/es/comparar` | 2733 ms | 5.8 % | 8.9 % |

**Decision: the margin to the assert stays under 10 % knowingly.** The 2900 ms budget is already the alarm set
100 ms under this ADR's 3.0 s ceiling (decision 1), so for this profile a warning is the expected state, not a
surprise. The budget is not raised to silence it: a red means the LCP crossed 2.9 s and is investigated as a
regression. The warning stays on so every run prints the figure. The only lever is still the font subset in
decision 3 (a contract and design-system amendment). S3 phase 4 measures again with the four new routes.
