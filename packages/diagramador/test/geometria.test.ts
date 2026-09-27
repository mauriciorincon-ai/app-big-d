// @vitest-environment node
// Geometría (CONTRATO § 5.3, § 6): D11 = 0 en todos los mapas del contrato y sus tres vistas, avisos de
// geometría exactos, A3 dibujado a 380 px sin avisos, G5 (mapas comparables) y la independencia del idioma.
import { describe, expect, it } from "vitest";
import { crossings, toSVG } from "../src/index";
import { EJEMPLOS } from "./lib/contrato";
import { A3, CASOS, disponer } from "./lib/casos";

describe("D11 — ningún flujo atraviesa una caja ajena", () => {
  for (const c of CASOS)
    it(`${c.nombre}: 0 cruces`, () => {
      expect(crossings(disponer(c.mapa, c.vista))).toEqual([]);
    });
});

describe("avisos de geometría (§ 5.3)", () => {
  // El único aviso declarado: prueba-arquitectura-app tiene 3 saltos y el carril exprés trae 2 pistas.
  const DECLARADOS: Record<string, string[]> = {
    "app-ejemplo": ["carril exprés: 3 saltos en 2 pistas; se agregan 1 (la fila de franjas se corre)"],
  };
  for (const c of CASOS)
    it(`${c.nombre}: ${DECLARADOS[c.mapa.sujeto_id] ? "solo el declarado" : "sin avisos"}`, () => {
      expect(disponer(c.mapa, c.vista).avisos).toEqual(DECLARADOS[c.mapa.sujeto_id] ?? []);
    });
});

describe("A3 — cuatro modos entre dos bloques (P4, D-S1-01)", () => {
  const geo = disponer(A3, "nivel-1");
  const etiqueta = geo.rotulos.find((r) => r.id === "etiqueta origen.entrada")!;
  it("una sola línea con la etiqueta de los cuatro marcadores, en dos filas (38 × 32 u)", () => {
    expect(etiqueta.caja.w).toBe(380);
    expect(etiqueta.caja.h).toBe(320);
    const svg = toSVG(geo, { language: "es" });
    const grupo = svg.match(/<g class="dg-etiqueta" aria-hidden="true" data-dueno="origen\.entrada">.*?<\/g>/)![0];
    expect(grupo.match(/<use /g)).toHaveLength(4);
  });
  it("la etiqueta cabe en el canal de 50 u entre las dos columnas", () => {
    const origen = geo.cajas.find((c) => c.id === "origen")!.caja;
    const entrada = geo.cajas.find((c) => c.id === "entrada")!.caja;
    expect(etiqueta.caja.x).toBeGreaterThanOrEqual(origen.x + origen.w);
    expect(etiqueta.caja.x + etiqueta.caja.w).toBeLessThanOrEqual(entrada.x);
  });
});

describe("G5 — mapas de una misma gramática son comparables", () => {
  const mismos = [EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!, A3];
  it("en el nivel 1, cada capa en la misma columna y cada franja en la misma fila", () => {
    const geos = mismos.map((m) => disponer(m, "nivel-1"));
    expect(geos[1]!.columnas).toEqual(geos[0]!.columnas);
    expect(geos[1]!.filas).toEqual(geos[0]!.filas);
    expect(geos[1]!.ancho).toBe(geos[0]!.ancho);
  });
  it("en el nivel 2 las columnas no se mueven", () => {
    const geos = mismos.map((m) => disponer(m, "nivel-2"));
    expect(geos[1]!.columnas).toEqual(geos[0]!.columnas);
  });
});

describe("la geometría no depende del idioma (§ 5.3)", () => {
  const sinTexto = (svg: string, l: string) =>
    svg
      .replace(/<text[^>]*>.*?<\/text>/g, "")
      .replace(/ aria-label="[^"]*"/g, "")
      .replace(/<title[^>]*>.*?<\/title>|<desc[^>]*>.*?<\/desc>/g, "")
      .replace(new RegExp(`-${l}-`, "g"), "-ID-")
      .replace(new RegExp(` lang="${l}"`), "");
  for (const c of CASOS.filter((x) => x.mapa.gramatica_id === "plataformas-datos" || x.mapa.gramatica_id === "agentes-ia"))
    it(`${c.nombre}: los SVG en español y en inglés solo difieren en el texto`, () => {
      const geo = disponer(c.mapa, c.vista);
      expect(sinTexto(toSVG(geo, { language: "en" }), "en")).toBe(sinTexto(toSVG(geo, { language: "es" }), "es"));
    });
});
