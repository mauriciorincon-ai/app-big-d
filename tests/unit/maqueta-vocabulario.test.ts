import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { TINTAS_VETADAS } from "../../scripts/paleta/generar-tokens.mjs";
import { archivosMaqueta, leer, textoVisible } from "./lib/maqueta";
import { usosVetados } from "./lib/tintas";

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
 * registrada en sprints/ETAPA-DISENO-implementation-log.md. A-24 (S1, fase 4) cerró cinco huecos, con su demo
 * en rojo en sprints/SPRINT_001-implementation-log.md: `content:` con comillas simples o escapes (`\2713`), el
 * texto de los atributos (`data-es`, `data-en`, `aria-label`, `title`, `alt`, `placeholder`), `<image>` y
 * `url()` de fondo, `style="color:…"` y `fill:` sobre texto en CSS, y la huella de `metricas.json`.
 */
type Cobertura = { fuentes: Record<string, { sha256: string; rangos: [number, number][] }> };
const cobertura = JSON.parse(readFileSync("docs/diseno/assets/fuentes/cobertura.json", "utf8")) as Cobertura;
const cubre = (cp: number) =>
  Object.values(cobertura.fuentes).some((f) => f.rangos.some(([a, b]) => cp >= a && cp <= b));

/** El texto de los atributos que alguien lee (el lector de pantalla o el conmutador de idioma). */
const ATRIBUTOS = /\s(?:data-es|data-en|aria-label|title|alt|placeholder)="([^"]*)"/g;
const textoDeAtributos = (html: string) => [...html.matchAll(ATRIBUTOS)].map((m) => textoVisible(m[1]!)).join(" ");
/** `content:` de CSS con comillas dobles o simples y sus escapes (`\2713 ` es ✓). */
const contenidosCss = (css: string) =>
  [...css.matchAll(/content:\s*(["'])((?:\\.|(?!\1).)*)\1/g)].map((m) =>
    m[2]!.replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, "$1"),
  );

const VETADAS: Array<[RegExp, string]> = [
  [/casa del lago/i, "calco de «lakehouse» (mercado § 6.B)"],
  [/lago de datos/i, "calco de «data lake»: se dice «data lake» y se explica en el glosario"],
  [/lorem|ipsum|TODO|FIXME|XXX/, "relleno o pendiente"],
];

type Metricas = { fuentes: Record<string, { sha256: string }> };
const metricas = JSON.parse(readFileSync("docs/diseno/assets/fuentes/metricas.json", "utf8")) as Metricas;

describe("maqueta — la fuente declarada es la fuente real", () => {
  it.each(Object.keys(cobertura.fuentes))("la huella de %s coincide con cobertura.json", (n) => {
    const bytes = readFileSync(`docs/diseno/assets/fuentes/${n}.woff2`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(cobertura.fuentes[n].sha256);
  });
  it("metricas.json (la tabla G15) mide las mismas fuentes que cobertura.json, con la misma huella", () => {
    expect(Object.keys(metricas.fuentes).sort()).toEqual(Object.keys(cobertura.fuentes).sort());
    for (const n of Object.keys(metricas.fuentes)) {
      const bytes = readFileSync(`docs/diseno/assets/fuentes/${n}.woff2`);
      expect(metricas.fuentes[n]!.sha256, n).toBe(createHash("sha256").update(bytes).digest("hex"));
    }
  });
});

describe("maqueta — vocabulario y glifos", () => {
  const html = archivosMaqueta(/\.html$/);
  const css = archivosMaqueta(/\.css$/);

  it("hay HTML que inspeccionar", () => expect(html.length).toBeGreaterThan(0));

  it("todo carácter visible existe en Space Grotesk o JetBrains Mono (sin respaldo del sistema, sin emojis)", () => {
    const fuera: string[] = [];
    for (const f of html)
      for (const ch of new Set(textoVisible(leer(f)) + textoDeAtributos(leer(f))))
        if (!/\s/.test(ch) && !cubre(ch.codePointAt(0)!))
          fuera.push(`${relative(".", f)}  «${ch}» U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`);
    for (const f of css)
      for (const s of contenidosCss(leer(f)))
        for (const ch of s) if (!cubre(ch.codePointAt(0)!)) fuera.push(`${relative(".", f)}  content «${ch}»`);
    expect(fuera, `caracteres fuera de la fuente (dibújalos como glifo SVG):\n${fuera.join("\n")}`).toEqual([]);
  });

  it("sin calcos ni relleno", () => {
    const hallazgos: string[] = [];
    for (const f of html) {
      const t = `${textoVisible(leer(f))} ${textoDeAtributos(leer(f))}`;
      for (const [re, que] of VETADAS) if (re.test(t)) hallazgos.push(`${relative(".", f)}  ${que}`);
    }
    expect(hallazgos).toEqual([]);
  });

  it("cero imágenes: ni <img>, ni <image> en un SVG, ni url() de fondo (el visual se genera en SVG; ningún logo de fabricante)", () => {
    const con = [
      ...html.filter((f) => /<img\b|<image\b|background(?:-image)?\s*:[^;"]*url\(/i.test(leer(f))),
      ...css.filter((f) => /background(?:-image)?\s*:[^;]*url\(/i.test(leer(f))),
    ].map((f) => relative(".", f));
    expect(con).toEqual([]);
  });

  it("las tintas vetadas no colorean texto", () => {
    const con = [
      ...html.flatMap((f) => usosVetados(leer(f), "html", TINTAS_VETADAS).map((u) => `${relative(".", f)}  ${u}`)),
      ...css.flatMap((f) => usosVetados(leer(f), "css", TINTAS_VETADAS).map((u) => `${relative(".", f)}  ${u}`)),
    ];
    expect(con).toEqual([]);
  });
});
