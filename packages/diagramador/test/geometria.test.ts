// @vitest-environment node
// Geometría (CONTRATO § 5.3, § 6): D11 = 0 en todos los mapas del contrato y sus tres vistas, avisos de
// geometría exactos, A3 dibujado a 380 px sin avisos, G5 (mapas comparables) y la independencia del idioma.
import { describe, expect, it } from "vitest";
import { crossings, toSVG, type Geometria } from "../src/index";
import { lejanas } from "../src/layout/d11";
import { EJEMPLOS } from "./lib/contrato";
import { A3, CASOS, disponer } from "./lib/casos";

describe("D11 — ningún flujo atraviesa una caja ajena", () => {
  for (const c of CASOS)
    it(`${c.nombre}: 0 cruces`, () => {
      expect(crossings(disponer(c.mapa, c.vista))).toEqual([]);
    });
});

describe("avisos de geometría (§ 5.3)", () => {
  // Ninguno. prueba-arquitectura-app trae 3 saltos: el carril exprés crece a 3 pistas sin avisar (enmienda
  // del piloto; antes era el único aviso declarado).
  for (const c of CASOS)
    it(`${c.nombre}: sin avisos`, () => {
      expect(disponer(c.mapa, c.vista).avisos).toEqual([]);
    });
});

describe("A3 — cuatro modos entre dos bloques (P4, D-S1-01)", () => {
  const geo = disponer(A3, "nivel1");
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
    const geos = mismos.map((m) => disponer(m, "nivel1"));
    expect(geos[1]!.columnas).toEqual(geos[0]!.columnas);
    expect(geos[1]!.filas).toEqual(geos[0]!.filas);
    expect(geos[1]!.ancho).toBe(geos[0]!.ancho);
  });
  it("en el nivel 2 las columnas no se mueven", () => {
    const geos = mismos.map((m) => disponer(m, "nivel2"));
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

describe("M-1 — D11 y las pistas de carriles también llegan como aviso", () => {
  // caso-ejemplo (carriles) con seis flujos llega → valora: el canal entre sus ranuras pide seis pistas y la
  // 6.ª cae a 30 u del centro, dentro de la caja de al lado. Antes: 0 avisos y el cruce solo lo veía `crossings`.
  const caso = EJEMPLOS.find((m) => m.sujeto_id === "caso-ejemplo")!;
  const denso = structuredClone(caso);
  for (let i = 1; i <= 6; i++) denso.flujos.push({ ...caso.flujos[0]!, id: `fx${i}`, origen: "llega", destino: "valora" });
  const geo = disponer(denso, "nivel2");
  it("la pista que se sale del canal se avisa", () => {
    expect(geo.avisos.filter((a) => a.tipo === "carriles")).not.toEqual([]);
  });
  it("cada cruce de `crossings` aparece como aviso «D11»", () => {
    const d11 = crossings(geo).map((c) => `D11: ${c.flujo} atraviesa la caja de ${c.caja}`);
    expect(d11).not.toEqual([]);
    expect(geo.avisos.map((a) => a.mensaje)).toEqual(expect.arrayContaining(d11));
    expect(geo.cruces).toEqual(crossings(geo));
  });
});

describe("A-6 — ida y vuelta entre dos componentes vecinos de una columna (nivel 2 y recorrido)", () => {
  const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
  const ida = m.flujos.find((f) => f.id === "f-semantico-tablero")!;
  m.flujos.push({ ...ida, id: "f-tablero-semantico", origen: ida.destino, destino: ida.origen });
  it.each(["nivel1", "nivel2", "recorrido"] as const)("%s: sin avisos, sin cruces y sin trazados que compartan puntos", (vista) => {
    const geo = disponer(m, vista);
    expect(geo.avisos).toEqual([]);
    expect(crossings(geo)).toEqual([]);
    const a = geo.trazados.find((t) => t.id === "f-semantico-tablero");
    const b = geo.trazados.find((t) => t.id === "f-tablero-semantico");
    if (a && b) {
      const pa = new Set(a.puntos.map((p) => p.join(",")));
      expect(b.puntos.filter((p) => pa.has(p.join(",")))).toEqual([]);
    }
  });
});

describe("M-24 — una fila de fichas de franja que no cabe se avisa", () => {
  it("nube-ejemplo con un bloque en identidad: dos fichas de 180 u no caben tras la cabecera", () => {
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "nube-ejemplo")!);
    m.bloques.push({ ...m.bloques[0]!, id: "acceso-central", banda_id: "identidad", nombre: { es: "Acceso central", en: "Central access" } });
    const extra = structuredClone(m.nodos.find((n) => n.id === "directorio")!);
    m.nodos.push({ ...extra, id: "federacion", bloque_id: "acceso-central", nombre: { es: "Federación", en: "Federation" } });
    const geo = disponer(m, "nivel1");
    expect(geo.avisos).toContainEqual({ vista: "nivel1", tipo: "fuera-del-lienzo", id: "_identidad", mensaje: "fuera-del-lienzo: ficha _identidad" });
  });
});

describe("M-25 — un bloque sin componentes se avisa", () => {
  it("plataforma-ejemplo con un bloque vacío en la capa de consumo", () => {
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    const consumo = m.bloques.find((b) => b.id === "consumo-bi")!;
    m.bloques.push({ ...consumo, id: "vacio", nombre: { es: "Vacío", en: "Empty" } });
    expect(disponer(m, "nivel1").avisos).toContainEqual({ vista: "nivel1", tipo: "bloque-vacio", id: "vacio", mensaje: "bloque-vacio: vacio" });
  });
});

describe("§ 5.6 — `etiqueta:` toda etiqueta de modos a ≤ 30 u de su trazo, como aviso", () => {
  // Medido sobre la geometría: el centro de la etiqueta contra el tramo más cercano de su propio flujo.
  const geo = (d: number): Geometria => ({
    ...disponer(EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!, "nivel1"),
    trazados: [{ id: "f", origen: "a", destino: "b", puntos: [[0, 0], [1000, 0]] }],
    rotulos: [{ id: "etiqueta f", dueno: "f", caja: { x: 400, y: d - 90, w: 200, h: 180 } }],
  });
  it("a 30 u no se reporta; a 30,1 u sí, con el flujo y la distancia", () => {
    expect(lejanas(geo(300))).toEqual([]);
    expect(lejanas(geo(301))).toEqual([{ flujo: "f", distancia: 301 }]);
  });
  it("los mapas del contrato no tienen ninguna", () => {
    for (const c of CASOS) expect(disponer(c.mapa, c.vista).avisos.filter((a) => a.tipo === "etiqueta"), c.nombre).toEqual([]);
  });
});

