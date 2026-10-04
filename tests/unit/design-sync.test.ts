import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { bundle } from "../../scripts/design-sync/bundle";

// El bundle de design-sync/ (regla 16) es un DERIVADO: se regenera en memoria y tiene que ser idéntico, byte a
// byte, a lo versionado. Si cambia una hoja del producto, el motor o el dato de la Plataforma Ejemplo y nadie
// corre `node scripts/design-sync/generar.mjs`, esto se pone en rojo en el mismo PR. Y cada tarjeta cumple lo que
// Claude Design pide: la marca @dsCard en la primera línea, autocontenida y sin red.
const DIR = "design-sync";
const listar = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? listar(join(d, n)) : [join(d, n)]));

describe("design-sync (bundle del design system)", () => {
  const esperado = bundle();

  it("lo versionado es exactamente lo que genera bundle.ts, sin tarjetas de más ni de menos", () => {
    const enDisco = listar(DIR)
      .map((f) => relative(DIR, f))
      .filter((f) => f !== "README.md" && f !== "project.json")
      .sort();
    expect(enDisco).toEqual(Object.keys(esperado).sort());
    for (const [ruta, contenido] of Object.entries(esperado)) expect(readFileSync(join(DIR, ruta), "utf8"), ruta).toBe(contenido);
  });

  it("cada tarjeta abre con su marca @dsCard, es autocontenida y no pide nada a la red", () => {
    for (const [ruta, html] of Object.entries(esperado).filter(([r]) => r.startsWith("components/"))) {
      expect(html.split("\n")[0], ruta).toMatch(/^<!-- @dsCard group="[^"]+" name="[^"]+" -->$/);
      expect(html, ruta).not.toMatch(/<(?:script|link|img|image)\b|@import|url\(/i);
      // Un id repetido en una misma tarjeta rompe los enlaces de accesibilidad (aria-*) y las referencias del SVG.
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.length, `${ruta}: ids repetidos`).toBe(new Set(ids).size);
      // URL admitidas, ninguna es una petición: el espacio de nombres del SVG y las fuentes ficticias de la
      // Plataforma Ejemplo (example.org, regla 12), que la ficha nombra como texto.
      const urls = [...html.matchAll(/https?:\/\/[^"<>\s]+/g)].map((m) => m[0]);
      expect(urls.filter((u) => u !== "http://www.w3.org/2000/svg" && !u.startsWith("https://example.org/")), ruta).toEqual([]);
    }
  });

  it("project.json dice su destino sin guardar ningún token", () => {
    const p = JSON.parse(readFileSync(join(DIR, "project.json"), "utf8")) as Record<string, unknown>;
    expect(Object.keys(p).sort()).toEqual(["lastPublished", "name", "nota", "projectId", "publishedFiles"]);
    expect(JSON.stringify(p)).not.toMatch(/token|secret|sk-|Bearer/i);
  });
});
