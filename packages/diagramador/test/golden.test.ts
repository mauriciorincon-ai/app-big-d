// @vitest-environment node
// G1 — golden files: el SVG de cada mapa del contrato, en cada vista y en cada idioma que su gramática
// declara, byte a byte, más SHA256SUMS (la huella que la prueba en los tres navegadores compara). Tres
// corridas en el mismo proceso dan los mismos bytes.
//
// Regenerar (solo cuando el cambio del dibujo es intencional y se revisó como imagen):
//   ACTUALIZAR_GOLDEN=1 pnpm exec vitest run packages/diagramador/test/golden.test.ts
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { layout, toSVG } from "../src/index";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { CASOS, FECHA, disponer } from "./lib/casos";
import { TEXTOS } from "./lib/textos";

const DIR = new URL("./golden/", import.meta.url);
const ACTUALIZAR = process.env.ACTUALIZAR_GOLDEN === "1";
const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/**
 * La vista «bloque» (D-S1-53, la ventana de un bloque del nivel 1): un bloque con un flujo adentro y uno de
 * franja, que usa la ficha compacta. Mismos casos en tests/determinismo/entrada.ts.
 */
export const BLOQUES = [
  ["plataforma-ejemplo", "consumo-bi"],
  ["plataforma-ejemplo", "gobierno"],
] as const;

export const SALIDAS: { archivo: string; svg: () => string }[] = [
  ...CASOS.flatMap((c) =>
    GRAMATICAS[c.mapa.gramatica_id]!.idiomas.map((idioma) => ({
      archivo: `${c.clave}.${c.vista}.${idioma}.svg`,
      svg: () => toSVG(disponer(c.mapa, c.vista), { language: idioma }),
    })),
  ),
  ...BLOQUES.flatMap(([sujeto, grupo]) => {
    const m = EJEMPLOS.find((e) => e.sujeto_id === sujeto)!;
    const g = GRAMATICAS[m.gramatica_id]!;
    return g.idiomas.map((idioma) => ({
      archivo: `${sujeto}.bloque-${grupo}.${idioma}.svg`,
      svg: () => toSVG(layout(m, g, "bloque", { texts: TEXTOS, queryDate: FECHA, group: grupo }), { language: idioma }),
    }));
  }),
];
const generar = (s: (typeof SALIDAS)[number]) => s.svg();

if (ACTUALIZAR) {
  mkdirSync(DIR, { recursive: true });
  const sumas = SALIDAS.map((s) => {
    const svg = generar(s);
    writeFileSync(new URL(s.archivo, DIR), svg);
    return `${sha256(svg)}  ${s.archivo}`;
  }).sort((a, b) => (a.slice(66) < b.slice(66) ? -1 : 1));
  writeFileSync(new URL("SHA256SUMS", DIR), `${sumas.join("\n")}\n`);
}

describe("golden files del diagramador (G1)", () => {
  const sumas = existsSync(new URL("SHA256SUMS", DIR)) ? readFileSync(new URL("SHA256SUMS", DIR), "utf8") : "";
  it(`son ${SALIDAS.length}: los 6 mapas del contrato × 3 vistas × sus idiomas, más A3 en el nivel 1 y dos bloques`, () => {
    expect(sumas.trim().split("\n")).toHaveLength(SALIDAS.length);
  });
  for (const s of SALIDAS)
    it(`${s.archivo}: mismos bytes y misma huella`, () => {
      const svg = generar(s);
      expect(svg).toBe(readFileSync(new URL(s.archivo, DIR), "utf8"));
      expect(sumas).toContain(`${sha256(svg)}  ${s.archivo}\n`);
    });
  it("tres corridas en el mismo proceso dan los mismos bytes", () => {
    for (const s of SALIDAS) {
      const a = generar(s);
      expect(generar(s)).toBe(a);
      expect(generar(s)).toBe(a);
    }
  });
});
