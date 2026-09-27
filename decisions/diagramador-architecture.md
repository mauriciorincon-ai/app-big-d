# Diagramador architecture: own band placement and channel routing, as a workspace package

**Status:** accepted · **Date:** 2026-09-27 · **Sprint:** S1 (Atlas de Fabric)

## Context

Big-D is the pilot of the house's first reusable, the **diagramador**. Its contract lives in the planner
(`reusables/diagramador/CONTRATO.md`, v0.3.0) and is copied byte for byte into `packages/diagramador/`
with `CONTRATO.lock`. The contract fixes the architecture (§ 3, D1–D4, D11, P1): bands from a declared
grammar become fixed columns (layers) and full-width strips below (transversals); flows are routed
orthogonally through channels; **ELK and dagre are forbidden as placement engines**. The spike and the
technical research measured why: elkjs moved 8–17 nodes in unrelated bands after a one-node change,
dagre 1–17, Graphviz 5–17, while the band grid moved 0 and was byte-identical in four engines.

## Decision

1. **Own placement by bands + orthogonal routing by channels**, implemented as pure TypeScript in
   `packages/diagramador/src/` (`layout/`), following CONTRATO § 5.3 geometry: 152 u columns, 50 u
   channels, 8 u margins, 152×104 blocks (level 1), 152×84 nodes stacked at 40 u (level 2), a 2-track
   express lane under the columns for jumps, backward flows through the shared channel, transversal
   strips below with a 200 u header, and **strip references instead of lines** (D15).
2. **The layout returns a geometry object that does not depend on language** (sizes use the longest
   text among declared languages). Properties (G5, G6, D3, order invariance) and D11 are tested on the
   geometry, never by parsing SVG.
3. **Workspace package** (`pnpm-workspace.yaml` → `packages/*`, linked with `workspace:*`, compiled by
   Next through `transpilePackages`). It imports nothing from the app, nor the framework, nor Node I/O
   (ESLint rule scoped to the package, demonstrated red); its tests live inside the package.
4. **elkjs stays as plan B for routing only**, and only through a new ADR if the channel router fails
   D11 on a real map after data and rules were revised (S1 risk 1).
5. Gaps the contract leaves open are decided here and proposed back as contract amendments in the
   sprint summary: the report adds severities (`{errores, alertas, avisos}`), `validateGrammar` exists
   for grammar-only checks, validity per element is the oldest `fecha_verificacion` beneath it, lane
   (`carril`) geometry for `prueba-procesos`, UI strings arrive in `options.textos`, and a mode label
   with more than two modes wraps into two rows so A3 fits a 50 u channel.

## Consequences

- Gains: locality of change (G6) and comparability (G5) by construction; zero third-party layout
  dependency; the same geometry for every platform (N platforms, no special cases).
- Costs: no automatic crossing minimisation (curated through `orden`, per D10); route quality on long
  jumps is ours to maintain; every new grammar shape (lanes) needs explicit geometry.
- Verification: 31/31 contract carnadas, D11 = 0 on every map and view, golden files by SHA-256 in
  Node (ubuntu, macOS) and Chromium, Firefox and WebKit (job `diagramador`).
