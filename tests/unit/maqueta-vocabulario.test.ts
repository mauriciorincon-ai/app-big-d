import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { TINTAS_VETADAS } from "../../scripts/paleta/generar-tokens.mjs";
import { archivosMaqueta, leer, textoVisible } from "./lib/maqueta";

/**
 * Gate de VOCABULARIO Y GLIFOS de la maqueta (Etapa de Diseño; reglas duras 5, 8, 13 y 20).
 *
 * 1. Todo carácter visible existe en las fuentes declaradas (Space Grotesk o JetBrains Mono). Un
 *    carácter fuera de ella cae en la fuente de respaldo del sistema: cambia de ancho entre
 *    navegadores (rompe G15 y el determinismo de G1) y es como entran los emojis. Los símbolos de
 *    estado (✓ ✕ ▶ β) se DIBUJAN como glifos SVG propios — D19.
 * 2. Cero calcos vetados («casa del lago»: la traducción automática de *lakehouse*), cero relleno.
 * 3. Cero `<img>`: el visual se genera en SVG; así no entra un logo de fabricante (regla 5).
 * 4. Las tintas vetadas como texto no se usan como `color` ni como relleno de `<text>` (regla 5-b).
 *
 * Demo en rojo (regla 15): «casa del lago» y un ✓ como carácter plantados en index.html —
 * registrada en sprints/ETAPA-DISENO-implementation-log.md.
 */
type Cobertura = { fuentes: Record<string, { sha256: string; rangos: [number, number][] }> };
const cobertura = JSON.parse(readFileSync("docs/diseno/assets/fuentes/cobertura.json", "utf8")) as Cobertura;
const cubre = (cp: number) =>
  Object.values(cobertura.fuentes).some((f) => f.rangos.some(([a, b]) => cp >= a && cp <= b));

const VETADAS: Array<[RegExp, string]> = [
  [/casa del lago/i, "calco de «lakehouse» (mercado § 6.B)"],
  [/lago de datos/i, "calco de «data lake»: se dice «data lake» y se explica en el glosario"],
  [/lorem|ipsum|TODO|FIXME|XXX/, "relleno o pendiente"],
];

describe("maqueta — la fuente declarada es la fuente real", () => {
  it.each(Object.keys(cobertura.fuentes))("la huella de %s coincide con cobertura.json", (n) => {
    const bytes = readFileSync(`docs/diseno/assets/fuentes/${n}.woff2`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(cobertura.fuentes[n].sha256);
  });
});

describe("maqueta — vocabulario y glifos", () => {
  const html = archivosMaqueta(/\.html$/);
  const css = archivosMaqueta(/\.css$/);

  it("hay HTML que inspeccionar", () => expect(html.length).toBeGreaterThan(0));

  it("todo carácter visible existe en Space Grotesk o JetBrains Mono (sin respaldo del sistema, sin emojis)", () => {
    const fuera: string[] = [];
    for (const f of html)
      for (const ch of new Set(textoVisible(leer(f))))
        if (!/\s/.test(ch) && !cubre(ch.codePointAt(0)!))
          fuera.push(`${relative(".", f)}  «${ch}» U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`);
    for (const f of css)
      for (const [, s] of leer(f).matchAll(/content:\s*"([^"]*)"/g))
        for (const ch of s) if (!cubre(ch.codePointAt(0)!)) fuera.push(`${relative(".", f)}  content «${ch}»`);
    expect(fuera, `caracteres fuera de la fuente (dibújalos como glifo SVG):\n${fuera.join("\n")}`).toEqual([]);
  });

  it("sin calcos ni relleno", () => {
    const hallazgos: string[] = [];
    for (const f of html) {
      const t = textoVisible(leer(f));
      for (const [re, que] of VETADAS) if (re.test(t)) hallazgos.push(`${relative(".", f)}  ${que}`);
    }
    expect(hallazgos).toEqual([]);
  });

  it("cero <img> (el visual se genera en SVG; ningún logo de fabricante)", () => {
    const con = html.filter((f) => /<img\b/i.test(leer(f))).map((f) => relative(".", f));
    expect(con).toEqual([]);
  });

  it("las tintas vetadas no colorean texto", () => {
    const v = TINTAS_VETADAS.join("|");
    const re = new RegExp(`(?:^|[;{\\s])color:\\s*var\\(--(?:${v})\\)|<text[^>]*fill="var\\(--(?:${v})\\)"`, "m");
    const con = [...html, ...css].filter((f) => re.test(leer(f))).map((f) => relative(".", f));
    expect(con).toEqual([]);
  });
});
