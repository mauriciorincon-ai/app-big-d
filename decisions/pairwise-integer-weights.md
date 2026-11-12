# Pairwise weights in integer arithmetic (D7)

**Status:** accepted · **Date:** 2026-11-11 · **Sprint:** S8 (the case moves)

## Context

Since S8, the draft profile offers a second way to propose weights: pairwise comparison, Saaty's analytic hierarchy
process. A person judges each pair of criteria on the 1–9 scale. A judgment of k means one criterion is k times as
important as the other, and the matrix holds 1/k on the other side. From the reciprocal matrix the core derives weights
and a consistency ratio.

Hard rule 1 forbids clocks, randomness and inexact functions in `src/engine/`. The same input must give the same bytes
in Node, Chromium, Firefox and WebKit. The textbook methods use floating point: the principal eigenvector, or the n-th
root of each row's product. Neither can ship as written. Hard rule 5 adds a second requirement: reordering the criteria
must not change any result.

This decision is irreversible in practice because the profile's history depends on it. Once a person approves weights
proposed by this method, the method that produced them has to keep producing them. That is why it gets an ADR.

## Decision

`src/engine/pares.ts` computes everything in `BigInt`, with no `**` and no `Math.pow`:

1. **Weights.** It takes the **geometric mean of each row** in fixed point:
   `G_i = ⌊(Π_j a_ij · S^n)^(1/n)⌋`, with `S = 10^12`.
   - The product is an exact rational, `P_i / Q_i`.
   - The n-th root is the exact integer floor, found by binary search (`raizEntera`).
   - `⌊⌊x⌋^(1/n)⌋ = ⌊x^(1/n)⌋`, so only the root truncates.
   - It does not use power iteration on the eigenvector. That would need an iteration cap and a convergence test. The
     geometric mean is closed-form, and for n ≤ 15 it differs from the eigenvector by less than the hundredths shown.
2. **Hundredths.**
   - `w_i = G_i · 10 000 / Σ G`, distributed by largest remainder so the weights sum to exactly 10 000.
   - **Remainder ties are broken by criterion id**, comparing code units, never by position. Combined with ordering the
     matrix by id, this makes the result independent of criterion order. A fast-check property covers it.
3. **Consistency.**
   - `λ = (1/n) Σ_i (A·G)_i / G_i`, with each term floored at `F = 10^9`.
   - `CI = max(0, λ − n) / (n − 1)` and `CR = CI / RI_n`, both in thousandths.
   - The random index `RI_n` comes from data (`data/convenciones/pares.yaml`). It is Saaty's 1980 table for n = 3…15.
     Published tables differ by the simulation behind them, so it is a declared convention, like the 70/50/5 thresholds.
   - With n ≤ 2, every matrix is consistent and the ratio is `null`.
   - A ratio above `umbral_razon_milesimas` (100 = 0.10) **warns and does not block** (default (ii) of the sprint).
4. **Incomplete.** If any pair is still unjudged, the result is `incompleta` with the number of missing pairs. Nothing
   is inferred.

**Error bound.** The tests compare against a floating-point oracle.

- Weights: the root truncates at 10⁻¹² relative and the rounding at ±1 hundredth, so each weight stays within ±1
  hundredth of the exact value.
- λ and CR: with n ≤ 15 the floors lose less than n² / F, so both stay within ±1 thousandth.
- `tests/unit/nucleo/pares.test.ts` checks these bounds over 150 fast-check runs.

**Provenance.** The proposed weights carry `origen: comparacion-por-pares`. They become `declarado-por-usuario` only
through the usual approval command, which a person runs. The convention file stays outside the snapshot, because pairwise
weights are a proposal and are never evaluated.

## Consequences

- `NUCLEO.SHA256SUMS` adds five lines (`pares-1`, `pares-3`, `pares-4`, `pares-11-a`, `pares-11-b`). No existing line
  changes. Browsers check them through `tests/determinismo/nucleo.spec.ts`.
- `data/convenciones/` now holds three files, and the loader requires all three.
- Changing the method, the fixed points or the tie-break changes the bytes. Doing so needs a new ADR that supersedes
  this one.
