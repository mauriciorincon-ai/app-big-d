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
  // Ninguno. prueba-arquitectura-app trae 3 saltos: el carril exprés crece a 3 pistas sin avisar (enmienda
  // del piloto; antes era el único aviso declarado).
  for (const c of CASOS)
    it(`${c.nombre}: sin avisos`, () => {
      expect(disponer(c.mapa, c.vista).avisos).toEqual([]);
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

describe("M-1 — D11 y las pistas de carriles también llegan como aviso", () => {
  // caso-ejemplo (carriles) con seis flujos llega → valora: el canal entre sus ranuras pide seis pistas y la
  // 6.ª cae a 30 u del centro, dentro de la caja de al lado. Antes: 0 avisos y el cruce solo lo veía `crossings`.
  const caso = EJEMPLOS.find((m) => m.sujeto_id === "caso-ejemplo")!;
  const denso = structuredClone(caso);
  for (let i = 1; i <= 6; i++) denso.flujos.push({ ...caso.flujos[0]!, id: `fx${i}`, origen: "llega", destino: "valora" });
  const geo = disponer(denso, "nivel-2");
  it("la pista que se sale del canal se avisa", () => {
    expect(geo.avisos.filter((a) => a.startsWith("carriles:"))).not.toEqual([]);
  });
  it("cada cruce de `crossings` aparece como aviso «D11»", () => {
    const d11 = crossings(geo).map((c) => `D11: ${c.flujo} atraviesa la caja de ${c.caja}`);
    expect(d11).not.toEqual([]);
    expect(geo.avisos).toEqual(expect.arrayContaining(d11));
  });
});

describe("A-6 — ida y vuelta entre dos componentes vecinos de una columna (nivel 2 y recorrido)", () => {
  const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
  const ida = m.flujos.find((f) => f.id === "f-semantico-tablero")!;
  m.flujos.push({ ...ida, id: "f-tablero-semantico", origen: ida.destino, destino: ida.origen });
  it.each(["nivel-1", "nivel-2", "recorrido"] as const)("%s: sin avisos, sin cruces y sin trazados que compartan puntos", (vista) => {
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
    const geo = disponer(m, "nivel-1");
    expect(geo.avisos).toContain("ficha _identidad: se sale del lienzo");
  });
});

describe("M-25 — un bloque sin componentes se avisa", () => {
  it("plataforma-ejemplo con un bloque vacío en la capa de consumo", () => {
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    const consumo = m.bloques.find((b) => b.id === "consumo-bi")!;
    m.bloques.push({ ...consumo, id: "vacio", nombre: { es: "Vacío", en: "Empty" } });
    expect(disponer(m, "nivel-1").avisos).toContain("bloque vacio: no tiene componentes");
  });
});
