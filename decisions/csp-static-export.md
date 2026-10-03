# Content Security Policy for the static export

**Status:** accepted · **Date:** 2026-10-02 · **Sprint:** S2 (Databricks and Snowflake, side by side)

## Context

S1 left CSP as declared debt: the static export carries inline scripts. In S2 we looked at what Next 16
emits. Each product page has 3–5 inline `<script>` elements: the theme script (constant), React's
`self.__next_f` bootstrap and one to three flight payloads. The journey page also has one `<style>` (the
CSS generated from the step data). Across 24 pages there are 78 inline scripts and 31 distinct ones. The
flight payload carries the build ID, which Next generates at random when `generateBuildId` is not set, so
**every hash changes on every build**.

Next's own guide (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) says nonces
require dynamic rendering. Its static-export guide says `headers` are not supported with `output: "export"`.
Its documented fallback is `'unsafe-inline'`, which would make the policy decorative for scripts. A hash
list in `vercel.json` cannot work either: Vercel reads it before the build, and the hashes do not exist yet.

## Decision

1. **A meta CSP per page, written after the build.** `scripts/csp/inyectar.mjs` is the last step of
   `pnpm build`, which Vercel runs too. It hashes (SHA-256) each inline `<script>` and `<style>` of every
   product page in `out/` and injects `<meta http-equiv="Content-Security-Policy">` right after
   `<meta charSet>`, before any script.
   - The policy: `default-src 'self'`; `script-src` and `style-src` with `'self'` plus that page's hashes;
     `img-src 'self' data:`; `font-src 'self'`; `connect-src 'self'`, plus the Sentry ingest origin only
     when the build has a DSN; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`.
   - No `'unsafe-inline'` and no `'unsafe-eval'`.
2. **No inline attributes in product pages.** The step refuses to publish a page with a `style="…"` or an
   `on…=` attribute, which would need `'unsafe-hashes'`. The one `style` attribute (`display: contents` in
   the language switch) became a class.
3. **The design mockup gets a fixed header CSP.** `/diseno/**` is served by both `vercel.json` and
   `serve.json` with `script-src 'self'` and `style-src 'self' 'unsafe-inline'`. It has no inline scripts,
   but 187 `style` attributes in generated reference pages that are read-only. It leaves with the mockup at
   the H1 cycle close (A-25).
4. **`frame-ancestors` stays with `X-Frame-Options: DENY`**, because a meta CSP cannot carry it. Reporting
   directives are left out for the same reason.

## Gates

- `tests/unit/csp.test.ts` covers the pure function: placement, one hash per inline script and style, none
  for scripts with `src`, idempotent, refuses inline attributes, and the Sentry origin.
- `tests/e2e/csp.spec.ts` runs in the four browser projects. Every route has the meta without
  `'unsafe-inline'`, hydrates, switches theme and opens its card, with zero `securitypolicyviolation`
  events and zero page errors.
  - It was seen red: removing one hash from a built page produced `script-src-elem · inline` on that
    page and nothing on the untouched one.
- `tests/unit/servidor-config.test.ts` checks that the mockup's header CSP is the same in both servers.
- An offline `vercel build` confirmed the step runs on Vercel and the meta survives in
  `.vercel/output/static`.

## Consequences

Inline script execution is limited to the exact bytes each build produced, in every browser, without a
server. A future inline script or attribute fails the build or the e2e, not the user. If the app ever
needs a header-only directive, it has to come with a server or an edge function, by a new ADR.
