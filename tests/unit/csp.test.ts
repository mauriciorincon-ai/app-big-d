// @vitest-environment node
// D-S2-05: la CSP del export estático se inyecta después del build con la huella de cada script y estilo en
// línea. Estas pruebas miran la función pura; el e2e `csp.spec.ts` mira las páginas reales en cuatro motores.
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { carpetasDeSalida, conCSP, estilosEnLinea, inyectar, origenSentry, politica } from "../../scripts/csp/inyectar.mjs";
import { fallasDeSalida } from "../../scripts/csp/verificar-salida.mjs";

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
  it("suma los estilos de las demás páginas (se llega a ellas sin recargar), sin repetir", () => {
    const otra = PAGINA.replace(".x{fill:red}", "#rec[data-paso=\"1\"] .p{opacity:1}");
    const delSitio = [...estilosEnLinea(PAGINA), ...estilosEnLinea(otra)];
    const c = meta(conCSP(PAGINA, { estilosDelSitio: delSitio }).html);
    expect(c).toContain(`style-src 'self' ${[h(".x{fill:red}"), h('#rec[data-paso="1"] .p{opacity:1}')].sort().join(" ")};`);
    expect(c.match(new RegExp(h(".x{fill:red}").replace(/[+/]/g, "\\$&"), "g"))).toHaveLength(1);
  });
  it("con la DSN de Sentry suma su origen a connect-src; sin DSN, nada", () => {
    expect(origenSentry(undefined)).toEqual([]);
    expect(origenSentry("https://clave@o123.ingest.us.sentry.io/456")).toEqual(["https://o123.ingest.us.sentry.io"]);
    expect(politica({ scripts: [], estilos: [], conectar: ["https://o1.ingest.sentry.io"] })).toContain("connect-src 'self' https://o1.ingest.sentry.io");
  });
});

// S2-AUD-32: en Vercel, el adapter de Next copia las páginas a .next/output/static/ dentro de `next build`, y Vercel
// publica esa copia. La CSP se inyecta en cada carpeta que se publica; la maqueta (diseno/ en la raíz), en ninguna.
describe("CSP en cada carpeta que se publica", () => {
  function raizDePrueba(conAdapter: boolean): string {
    const raiz = mkdtempSync(join(tmpdir(), "bigd-csp-"));
    const carpetas = [join(raiz, "out"), ...(conAdapter ? [join(raiz, ".next/output/static")] : [])];
    for (const c of carpetas) {
      mkdirSync(join(c, "es"), { recursive: true });
      mkdirSync(join(c, "diseno"), { recursive: true });
      writeFileSync(join(c, "es/atlas.html"), PAGINA);
      writeFileSync(join(c, "diseno/index.html"), "<html><head></head><body style=\"x\"></body></html>");
    }
    if (conAdapter) writeFileSync(join(raiz, ".next/output/config.json"), "{}");
    return raiz;
  }
  it("sin el adapter de Vercel, solo out/; con él, también su copia en .next/output/static/", () => {
    const sin = raizDePrueba(false);
    const con = raizDePrueba(true);
    try {
      expect(carpetasDeSalida(sin)).toEqual([join(sin, "out")]);
      expect(carpetasDeSalida(con)).toEqual([join(con, "out"), join(con, ".next/output/static")]);
    } finally {
      rmSync(sin, { recursive: true, force: true });
      rmSync(con, { recursive: true, force: true });
    }
  });
  it("cada página de cada carpeta lleva su meta, y la maqueta de cada una queda como estaba", () => {
    const raiz = raizDePrueba(true);
    try {
      for (const c of carpetasDeSalida(raiz)) expect(inyectar(c, { raiz })).toMatchObject({ paginas: 1, scripts: 2 });
      for (const c of ["out", ".next/output/static"]) {
        expect(meta(readFileSync(join(raiz, c, "es/atlas.html"), "utf8"))).toContain("script-src 'self' 'sha256-");
        expect(readFileSync(join(raiz, c, "diseno/index.html"), "utf8")).not.toContain("Content-Security-Policy");
      }
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
  it("el gate de lo publicado nombra cada página sin meta, distinta de out/ o que no se publica", () => {
    const raiz = raizDePrueba(true);
    try {
      const [out, publicada] = carpetasDeSalida(raiz) as [string, string];
      expect(fallasDeSalida(publicada, out).fallas).toEqual(["es/atlas.html: 0 metas de CSP (se espera 1)"]);
      for (const c of [out, publicada]) inyectar(c, { raiz });
      expect(fallasDeSalida(publicada, out)).toEqual({ paginas: 1, fallas: [] });
      writeFileSync(join(out, "es/otra.html"), PAGINA);
      writeFileSync(join(publicada, "es/atlas.html"), readFileSync(join(publicada, "es/atlas.html"), "utf8").replace("<body>", "<body> "));
      expect(fallasDeSalida(publicada, out).fallas).toEqual([`es/atlas.html: distinta de la de ${out}`, `es/otra.html: está en ${out} y no se publica`]);
      expect(fallasDeSalida(join(raiz, "no-existe"), out).fallas).toEqual([`${join(raiz, "no-existe")}: no existe`]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
