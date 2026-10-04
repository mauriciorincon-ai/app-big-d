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
   - The policy: `default-src 'self'`; `script-src` with `'self'` plus that page's hashes; `style-src` with
     `'self'` plus the hashes of the inline `<style>` of **every page of the site**: a client-side navigation
     inserts the next page's `<style>` under the first page's policy (S2, phase 2). Scripts stay per page: React
     does not execute an inline `<script>` it inserts on the client. `img-src 'self' data:`; `font-src 'self'`; `connect-src 'self'`, plus the Sentry ingest origin only
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
5. **Every folder that is published gets the meta (S2-AUD-32, 2026-10-04).** On Vercel, Next 16 builds with the
   Vercel adapter (`NEXT_ENABLE_ADAPTER=1` in Vercel's build environment). Inside `next build`, the adapter's
   `onBuildComplete` copies every page to `.next/output/static/`. After the build command, Vercel publishes
   `.next/output`, not `out/`. The step ran on `out/` only, so the preview of PR #5 served every page without its
   meta. The person caught it by saving the preview page. The step now injects into `out/` and, when the adapter
   ran (it leaves `.next/output/config.json`), into `.next/output/static/` too, each with its own hashes. The two
   copies come out byte-identical.

## Gates

- `tests/unit/csp.test.ts` covers the pure function: placement, one hash per inline script and style, none
  for scripts with `src`, idempotent, refuses inline attributes, and the Sentry origin.
- `tests/e2e/csp.spec.ts` runs in the four browser projects. Every route has the meta without
  `'unsafe-inline'`, hydrates, switches theme and opens its card, with zero `securitypolicyviolation`
  events and zero page errors.
  - It was seen red: removing one hash from a built page produced `script-src-elem · inline` on that
    page and nothing on the untouched one.
  - It also walks the level tabs of every published platform in both languages without reloading and demands zero
    violations. It was seen red with the injector without the site's style hashes: four routes named
    `style-src-elem · inline` (implementation log, phase 2, «La CSP bloqueaba los estilos al cambiar de nivel sin
    recargar»).
- `tests/unit/servidor-config.test.ts` checks that the mockup's header CSP is the same in both servers.
- The `quality` job builds the way Vercel does: an offline `vercel build` (pinned CLI, project settings
  declared in the job, no token) with `NEXT_ENABLE_ADAPTER=1`. Then `scripts/csp/verificar-salida.mjs` checks
  `.vercel/output/static`: every product page has exactly one CSP meta right after `<meta charSet>` and is
  byte-identical to `out/`, the folder the e2e suite tests. No pages at all also fails.
  - It was seen red: with the previous injector, the adapter build gave 92 failures, each page named twice (0 metas,
    and different from `out/`). It turned green with the fix: 46 pages.
  - `tests/unit/csp.test.ts` covers the folder list (with and without the adapter) and the verifier. It was seen
    red when the folder list returned `out/` only: the two folder tests failed.
- Before S2-AUD-32, an offline `vercel build` without the adapter showed the meta in `.vercel/output/static`. It
  did not reproduce Vercel's environment, and the preview was the real check.

## Consequences

Inline script execution is limited to the exact bytes each build produced, in every browser, without a
server. A future inline script or attribute fails the build or the e2e, not the user. If the app ever
needs a header-only directive, it has to come with a server or an edge function, by a new ADR.

The style allowance is site-wide; the script allowance is per page.
