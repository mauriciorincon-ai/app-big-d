# Audit exception: braces (GHSA-vfj7-8cjw-p6xm)

**Status:** accepted · **Date:** 2026-10-02 (exception) · 2026-10-04 (this ADR) · **Sprint:** S3 (the comparator)

## Context

`pnpm audit --audit-level high` runs in the `quality` job. Since S2 it reports one high advisory with no fixed
version published: **GHSA-vfj7-8cjw-p6xm**, a regular-expression denial of service in `braces <= 3.0.3` through
nested patterns. On 2026-10-04 `npm view braces version` still returns 3.0.3 (last published 2024-09-18).

The only path to it (`pnpm why braces`, 2026-10-04):

```
app-big-d (devDependencies) > eslint-config-next@16.3.8 > @next/eslint-plugin-next@16.3.8
  > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3
```

It is a lint tool that runs in development and in CI. The exported site does not ship it, and no pattern it
expands comes from outside the repo.

Kit v1.34.0 (rule 18) allows an audit exception in `auditConfig.ignoreGhsas` only with an ADR that names the
advisory, the dependency path, the date and the condition that retires it. S2 put the exception in
`pnpm-workspace.yaml` with an inline comment and a test; this ADR is the record the kit now requires.

## Decision

1. `pnpm-workspace.yaml` → `auditConfig.ignoreGhsas: [GHSA-vfj7-8cjw-p6xm]`, with the comment that points here.
2. `tests/unit/avisos-ignorados.test.ts` keeps guarding it: every ignored advisory is documented, and its package
   is never reachable from production code.
3. `/deploy-check` reviews it at every sprint close.

## Retirement condition

Remove the entry (and this exception) as soon as **either** happens:

- `braces` 3.0.4 or later is published and the lockfile resolves to it; or
- `eslint-config-next` stops depending on `fast-glob` 3.3.1 / `micromatch` (dependabot's grouped PR would show it).

pnpm ignores an unused id silently: a stale entry would not fail the audit. So the retirement is a manual check in
`/deploy-check`, and this limit is declared here.

## Consequences

- One high advisory is accepted on a dev-only path; production bundles are unaffected.
- If a second advisory appears, it fails `quality` unless it gets its own ADR.
