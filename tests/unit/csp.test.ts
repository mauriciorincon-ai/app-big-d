// @vitest-environment node
// D-S2-05: la CSP del export estático se inyecta después del build con la huella de cada script y estilo en
// línea. Estas pruebas miran la función pura; el e2e `csp.spec.ts` mira las páginas reales en cuatro motores.
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { conCSP, origenSentry, politica } from "../../scripts/csp/inyectar.mjs";

const h = (s: string) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;
const TEMA = "document.documentElement.dataset.tema='oscuro'";
const PAGINA = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><script src="/a.js" async=""></script><script>${TEMA}</script></head><body><svg><style>.x{fill:red}</style></svg><script>self.__next_f.push([1,"<p style=\\"x\\">"])</script></body></html>`;
const meta = (html: string) => html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"\/>/)?.[1] ?? "";

describe("CSP del export estático", () => {
  it("va justo después de <meta charSet>, antes de cualquier script", () => {
    const { html } = conCSP(PAGINA);
    expect(html.indexOf('<meta http-equiv="Content-Security-Policy"')).toBe(html.indexOf('<meta charSet="utf-8"/>') + '<meta charSet="utf-8"/>'.length);
  });
  it("lleva la huella de cada script y estilo en línea, y no la de los scripts con src", () => {
    const r = conCSP(PAGINA);
    const c = meta(r.html);
    expect(r.scripts).toBe(2);
    expect(r.estilos).toBe(1);
    expect(c).toContain(`script-src 'self' ${[h(TEMA), h('self.__next_f.push([1,"<p style=\\"x\\">"])')].sort().join(" ")}`);
    expect(c).toContain(`style-src 'self' ${h(".x{fill:red}")}`);
    expect(c).not.toContain("unsafe-inline");
    expect(c).toContain("object-src 'none'");
    expect(c).toContain("base-uri 'self'");
  });
  it("correrlo dos veces da los mismos bytes (una sola meta)", () => {
    const una = conCSP(PAGINA).html;
    expect(conCSP(una).html).toBe(una);
    expect(una.match(/Content-Security-Policy/g)).toHaveLength(1);
  });
  it("se niega a publicar un style= o un manejador on…= en línea, y dice cuál y dónde", () => {
    expect(() => conCSP(PAGINA.replace("<svg>", '<svg style="display:block">'), { archivo: "out/es.html" })).toThrow(/out\/es\.html: trae el atributo en línea «style=»/);
    expect(() => conCSP(PAGINA.replace("<svg>", '<svg onload="x()">'))).toThrow(/«onload=»/);
    expect(() => conCSP("<html><head></head></html>")).toThrow(/no trae <meta charSet/);
  });
  it("con la DSN de Sentry suma su origen a connect-src; sin DSN, nada", () => {
    expect(origenSentry(undefined)).toEqual([]);
    expect(origenSentry("https://clave@o123.ingest.us.sentry.io/456")).toEqual(["https://o123.ingest.us.sentry.io"]);
    expect(politica({ scripts: [], estilos: [], conectar: ["https://o1.ingest.sentry.io"] })).toContain("connect-src 'self' https://o1.ingest.sentry.io");
  });
});
