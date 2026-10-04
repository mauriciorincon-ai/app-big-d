# Design-system extensions from S2 (side by side and map versions)

**Status:** accepted · **Date:** 2026-10-04 · **Sprint:** S2 (Databricks and Snowflake, side by side)

## Context

`design-system.md` (v0.5.2) is read-only for product work: a design change is proposed in the sprint log and the
design system is extended by ADR (S2 order: «fiel a la maqueta y al design system (extensiones por ADR)»). S2 put
two new screens in the product, the side by side (`/[lang]/comparar`) and the versions of a map
(`/[lang]/atlas/[platform]/versiones`). Only the «Expand all» button had an ADR (`compare-in-the-engine`); the rest
lived in the implementation log as minor decisions. The final audit caught it (S2-AUD-14). This ADR gathers them,
one row per extension, each with the state of its look. The planning house folds it into the next design-system
version.

## Decision

| #   | Extension                                                                                                                                                                                                                                                          | Look                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 1   | One «Expand all / Collapse all» button at the top right of the diagram frame. It expands every band's components in the same drawing and collapses them again. It replaces the «Ver: bloques / componentes» switch (`design-system.md:169`) and per-band expansion | Seen by the person: M1 (sketch, 2026-10-02) and M2 (preview of PR #5, 2026-10-03) |
| 2   | The side by side always uses the components grid (1496 u), so expanding never moves a column. At 1280 px the canvas scrolls sideways, with its swipe hint and edge shadows                                                                                         | Seen in M2                                                                        |
| 3   | No validity badges in the side by side: each row states its validity in words in its label («v0.1.0 · por revisar · 34 días»). It is an amendment to § 4.8 and G7 of the semaphore, in the summary                                                                 | Seen in M2 (shape)                                                                |
| 4   | On a phone, the cards of a block are those of `toBlockCards`, one band at a time, with every chosen platform stacked                                                                                                                                               | Decided by the builder; travels to the cycle gate (h7, ⭐⭐)                      |
| 5   | `/comparar` carries the legend and the text reading under the drawing, like the atlas levels; the legend's trademark note names the real platforms, from the data (S2-AUD-05)                                                                                      | Decided; the note is a TEXT look, «maquetado, no visto»                           |
| 6   | The row label uses the body typeface, and its metadata is measured with the mono table (G15)                                                                                                                                                                       | Decided                                                                           |
| 7   | Difference marks: one pill per class present on a card, never collapsed; «removed» goes on the previous version's row                                                                                                                                              | Decided                                                                           |
| 8   | On `/versiones`, «Lo que dicen los componentes» and «Sin cambios en el dibujo»: new structure for what changes without changing the drawing, classified as TEXT by D-S2-10; a historic version is named in one line                                                | Travels to j5 (⭐⭐)                                                              |
| 9   | Send and receive marks are horizontal (§ 5.4 of contract 0.4.0); the mockup draws them ↑/↓                                                                                                                                                                         | Decided: the contract rules                                                       |

## Consequences

The product and `design-sync/` show these extensions; `design-system.md` does not yet. Three of its lines are out of
date:

- `design-system.md:169` still canonises the «Ver: bloques / componentes» switch that M1 retired;
- `design-system.md:282` says the side-by-side selector does not filter: it filters in the product, through the URL;
- `design-system.md:283` says the trademark note and the atlas platform selector are designed in S1: they were.

The planning house folds them into the next design-system version. Until then, this ADR and
`decisions/design-system-s1-extensions.md` are the extensions, and `design-sync/README.md` cites both.
