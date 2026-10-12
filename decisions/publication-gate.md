# The build refuses to publish when the instrument is not green

**Status:** accepted · **Date:** 2026-10-11 · **Sprint:** S4 (the instrument)

## Context

Big-D sells one guarantee: the comparison is open and reproducible, so anyone can repeat the calculation and get the same
bytes. A broken engine, a seeded error that stopped being caught, or a profile edited by hand after its approval would
break that guarantee silently: the site would still build and Vercel would still publish it. RF-09.4 asks that without a
green validation nothing is published.

## Decision

`pnpm build` starts with `node scripts/instrumento/validar.mjs`. If it exits non-zero, the chain (`&&`) stops before
`next build` and the CSP step: there is no `out/`, and `vercel build` fails for lack of a build.

- It validates the base about to be published (`data/`, or the folder of the `BIGD_DATOS` knob in the seeded build).
- It runs the 9 reference cases, the 7 fast-check properties (the very functions the test suite runs, same seed,
  `src/lib/instrumento/propiedades.ts`), 7 seeded errors and the integrity of what is approved (evidence, snapshots,
  case profiles, maps).
- A seeded error counts as **detected** only if the clean data raises no alarm and the defect does. The check uses the real
  code (the case schema, the loader, the engine), so weakening one of them makes its seeded error go undetected and the build
  stops: "detected 6 of 7 · not published".
- It deletes `out/` first, so a failed validation leaves nothing publishable behind. `.vercel/output` is left alone: Vercel's
  own build manages it and, without `next build`, it never fills.
- It writes `<data>/instrumento/validacion.json`, **without any time** (same base, same file; gitignored), which
  `/[idioma]/instrumento` reads. The page shows the result; it never validates.

## Why it is irreversible by design

A gate that can be skipped is decoration. There is no flag that publishes anyway, and the only knob, `BIGD_SALIDA`,
exists for the script's own tests so they do not delete the repo's `out/`. To publish again, what failed has to be fixed.

## Deviation from the sprint file

The sprint file proposed a test knob (`BIGD_INSTRUMENTO_OMITIR=<seeded error>`) to show the gate red. It was not built: the
demo mutates the real detector instead (`scripts/demo-rojo.sh` weakens the weights-sum check in
`src/lib/datos/conocimiento.ts`), which proves more and keeps test-only code out of the product. Result of that run
(2026-10-11): red naming "detected 6 of 7", no `out/`; green after restoring.

The repeatable version (S7, S4-M2) is `tests/unit/gates-en-rojo.test.ts`: it breaks a **copy** of the base (the case weights no longer
sum to 100 points), runs `scripts/instrumento/validar.mjs` against it and demands exit ≠ 0, "no se publica" in the output and no
`out/` left behind; the clean copy passes. Nothing in the repo is mutated, so it runs in every `pnpm test`.

## Consequences

- Every job that builds (`quality`, `e2e`, `lighthouse`, the seeded build) validates first: about one second.
- A base that is incomplete or inconsistent can no longer be published, whichever job notices first.
- The seeded error list is part of the product: adding one is adding a row to `src/lib/instrumento/sembrados.ts` with its
  clean control. Decision- and risk-related seeded errors (RF-09.3, second half) arrive with E3.
