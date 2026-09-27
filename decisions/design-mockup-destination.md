# Destination of the design mockup after G-Diseño (A-25)

**Status:** accepted · **Date:** 2026-09-27 · **Sprint:** S1 (Atlas de Fabric)

## Context

The Design Stage produced the approved reference mockup in `docs/diseno/`. The build copies it to
`public/diseno/` (`scripts/copiar-maqueta.mjs`), so every deployment — previews and production — serves
it at `/diseno/`. The stage audit (A-25) asked whether it should stay after G-Diseño and required that a
future public demo build never carries it. S1's fidelity gate compares the engine's output against
`docs/diseno/atlas-nivel-1.html` **on the preview**, so the mockup must be served there during S1. A-04
(paid in S1 phase 0) made it actually reachable: `serve.json` and `vercel.json` keep its `.html` URLs.

## Decision

1. **The mockup stays served at `/diseno/` in the private deployments throughout the H1 cycle**
   (S1–S4): it is the fidelity reference for every sprint with UI. Production is protected by Vercel
   Authentication; nothing about it is public.
2. **It never enters a public build.** The demo package for hoja-de-vida (E4, `pnpm build:demo`) must
   exclude `docs/diseno/` and `public/diseno/`; when that build exists, a test asserts that its output
   has no `diseno/` path.
3. **It is retired at the H1 cycle close by a new ADR** (the copy step leaves `build`), once the product
   screens carry the design and the design system is published.
4. `docs/diseno/` stays read-only for product work: a design change is proposed in the sprint log and
   the design system is extended by ADR (S1 order, «Qué NO tocar»).

## Consequences

The preview can host the fidelity gate; the reference cannot leak into the public demo; its retirement
is a planned decision, not forgotten debt.
