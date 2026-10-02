import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contraste, peorPar } from "../../scripts/paleta/color.mjs";
import {
  construir,
  css,
  TINTAS_VETADAS,
  UMBRALES,
} from "../../scripts/paleta/generar-tokens.mjs";

/**
 * Gate de PALETA DEL DIAGRAMADOR (Etapa de Diseño, D7–D8; CONTRATO G7, G13, D5 y Gaps).
 *
 * Mide sobre `docs/diseno/assets/tokens.json` —el archivo que la maqueta usa y que el renderizador
 * heredará— que (1) no deriva de su generador, (2) cada trazo de tipo se ve (≥ 3:1) sobre las
 * superficies donde vive el diagrama, (3) todo texto en tinta se lee (≥ 4,5:1) sobre fondo y
 * superficies, y (4) los 8 tipos se distinguen por color bajo visión normal y bajo simulación
 * Machado 2009 (protan/deutan/tritan, severidad 0,6 y 1,0) con umbral declarado, que no puede bajar
 * de los MÍNIMOS escritos aquí (D79): bajar el umbral y la paleta a la vez ya no deja el gate verde.
 *
 * Demo en rojo (regla 15): la paleta provisional del spike (Okabe-Ito, naranja #E69F00 en tipo-1)
 * en el tema claro — registrada en sprints/ETAPA-DISENO-implementation-log.md. A-24 (S1, fase 4): «un token
 * por tipo» ahora se compara contra la gramática, con su demo en rojo en SPRINT_001-implementation-log.md.
 */
type Tokens = ReturnType<typeof construir>;
/** Mínimos declarados (D79), literales a propósito: no se importan del generador que produce la paleta. */
const MINIMOS: Record<string, number> = {
  normal: 0.1,
  "protan-0.6": 0.06,
  "deutan-0.6": 0.06,
  "tritan-0.6": 0.06,
  "protan-1.0": 0.03,
  "deutan-1.0": 0.03,
  "tritan-1.0": 0.03,
};
const tokens = JSON.parse(
  readFileSync("docs/diseno/assets/tokens.json", "utf8"),
) as Tokens;
const temas = ["oscuro", "claro"] as const;
const tipos = tokens.tipos.map((t) => t.token);

describe("paleta del diagramador — umbrales declarados", () => {
  it.each(Object.entries(MINIMOS))(
    "el umbral %s del generador no baja del mínimo %s",
    (vista, minimo) => {
      expect(UMBRALES[vista as keyof typeof UMBRALES]).toBeGreaterThanOrEqual(
        minimo,
      );
    },
  );
});

describe("paleta del diagramador — tokens generados, sin deriva", () => {
  it("tokens.json coincide con su generador", () => {
    expect(tokens).toEqual(construir());
  });
  it("tokens.css coincide con su generador", () => {
    expect(readFileSync("docs/diseno/assets/tokens.css", "utf8")).toBe(
      css(construir()),
    );
  });
  it("la hoja del producto (src/styles/tokens.css) es la misma que genera el generador", () => {
    expect(readFileSync("src/styles/tokens.css", "utf8")).toBe(css(construir()));
  });
  it("hay exactamente un token por tipo de la gramática y ninguno repetido", () => {
    // Contra la gramática del contrato (A-24): el mismo tipo con el mismo token, ni uno de más ni de menos.
    const gramatica = JSON.parse(readFileSync("packages/diagramador/gramaticas/plataformas-datos.json", "utf8")) as {
      tipos_de_nodo: { id: string; token_color: string }[];
    };
    const deLaGramatica = gramatica.tipos_de_nodo.map((t) => `${t.id} → ${t.token_color}`).sort();
    expect(tokens.tipos.map((t) => `${t.id} → ${t.token}`).sort()).toEqual(deLaGramatica);
    expect(new Set(tipos).size).toBe(tipos.length);
    for (const tema of temas) {
      const hex = tipos.map((t) => tokens.temas[tema][t]);
      expect(new Set(hex).size).toBe(hex.length);
    }
  });
});

describe.each(temas)(
  "paleta del diagramador — contraste en tema %s",
  (tema) => {
    const t = tokens.temas[tema];
    it.each(tipos)(
      "trazo y glifo de %s ≥ 3:1 sobre sup-1 (lienzo) y sup-2 (tarjeta del nodo)",
      (tipo) => {
        expect(contraste(t[tipo], t["sup-1"])).toBeGreaterThanOrEqual(3);
        expect(contraste(t[tipo], t["sup-2"])).toBeGreaterThanOrEqual(3);
      },
    );
    it.each(["tinta-1", "tinta-2"])(
      "texto en %s ≥ 4,5:1 sobre fondo y superficies (la tarjeta del nodo es sup-2)",
      (tinta) => {
        for (const fondo of ["fondo", "sup-1", "sup-2"])
          expect(
            contraste(t[tinta], t[fondo]),
            `${tinta} sobre ${fondo}`,
          ).toBeGreaterThanOrEqual(4.5);
      },
    );
    it("las tintas vetadas como texto de verdad no alcanzan 4,5:1 (si la alcanzaran, el veto sobra)", () => {
      for (const v of TINTAS_VETADAS)
        expect(contraste(t[v], t["sup-1"])).toBeLessThan(4.5);
    });
  },
);

describe.each(temas)(
  "paleta del diagramador — distancia entre tipos en tema %s",
  (tema) => {
    const colores = tipos.map((id) => ({ id, hex: tokens.temas[tema][id] }));
    it.each(Object.entries(UMBRALES))(
      "vista %s: peor par ≥ %s (y ≥ su mínimo declarado)",
      (vista, umbral) => {
        const { min, par } = peorPar(colores, vista);
        expect(
          min,
          `peor par ${par.join("~")} = ${min.toFixed(3)}`,
        ).toBeGreaterThanOrEqual(Math.max(umbral, MINIMOS[vista] ?? 0));
      },
    );
  },
);
