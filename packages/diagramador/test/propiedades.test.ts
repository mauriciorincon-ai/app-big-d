// @vitest-environment node
// Propiedades (fast-check, semilla fija registrada en la bitácora): invariancia al orden de los datos (D3),
// D11 con flujos al azar, G5 al quitar flujos y G6 (localidad del cambio) en sus variantes (a), (b) y (c).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { crossings, layout, toBlockCards, toCard, toSVG, toText, type Flujo, type Geometria, type Mapa } from "../src/index";
import { EJEMPLOS, GRAMATICAS, leerJson } from "./lib/contrato";
import { disponer, FECHA } from "./lib/casos";
import { TEXTOS } from "./lib/textos";

const SEMILLA = 20260927;
const OPC = { seed: SEMILLA, numRuns: 40 };
const EJEMPLO = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const AGENTE = EJEMPLOS.find((m) => m.sujeto_id === "agente-ejemplo")!;
const clonar = (m: Mapa): Mapa => structuredClone(m);

/** Grupos de primer nivel del SVG por dueño (D12): una línea por grupo. */
function porDueno(svg: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const l of svg.split("\n")) {
    const d = l.match(/^<g [^>]*data-dueno="([^"]+)"/)?.[1];
    if (d) out.set(`${d}|${l.match(/^<g (?:id="[^"]+" )?class="([^"]+)"/)?.[1] ?? ""}`, l);
  }
  const cab = svg.split("\n").slice(0, 3).join("\n");
  out.set("|lienzo", cab);
  return out;
}
function cambiados(a: string, b: string): Set<string> {
  const A = porDueno(a);
  const B = porDueno(b);
  const out = new Set<string>();
  for (const k of new Set([...A.keys(), ...B.keys()])) if (A.get(k) !== B.get(k)) out.add(k.split("|")[0]!);
  return out;
}
const svg = (m: Mapa, vista: Parameters<typeof disponer>[1]) => toSVG(disponer(m, vista), { language: "es" });

describe("invariancia al orden de los datos (D3)", () => {
  for (const base of [EJEMPLO, AGENTE])
    it(`${base.sujeto_id}: barajar nodos, flujos y bloques no cambia ni un byte en ninguna vista`, () => {
      const antes = (["nivel-1", "nivel-2", "recorrido"] as const).map((v) => svg(base, v));
      fc.assert(
        fc.property(fc.shuffledSubarray(base.nodos, { minLength: base.nodos.length }), fc.shuffledSubarray(base.flujos, { minLength: base.flujos.length }), fc.shuffledSubarray(base.bloques, { minLength: base.bloques.length }), (nodos, flujos, bloques) => {
          const m = { ...clonar(base), nodos, flujos, bloques };
          expect((["nivel-1", "nivel-2", "recorrido"] as const).map((v) => svg(m, v))).toEqual(antes);
        }),
        OPC,
      );
    });
});

describe("invariancia al orden en todas las salidas (B-42 de la auditoría del S1)", () => {
  // Además de las tres vistas: la vista «bloque» de cada grupo, sus tarjetas, la lectura en texto y la ficha de
  // cada nodo; sobre el mapa de ejemplo, el mapa denso del piloto (P1) y un mapa de carriles (caso-ejemplo).
  const P1 = leerJson<Mapa>("carnadas/P1-mapa-denso.mapa.json");
  const CASO = EJEMPLOS.find((m) => m.sujeto_id === "caso-ejemplo")!;
  const salidas = (m: Mapa): string[] => {
    const G = GRAMATICAS[m.gramatica_id]!;
    const opc = { language: "es", texts: TEXTOS, queryDate: FECHA };
    const grupos = disponer(m, "nivel-1").vigencia.elementos.map((e) => e.id).sort();
    return [
      ...(["nivel-1", "nivel-2", "recorrido"] as const).map((v) => svg(m, v)),
      ...grupos.map((g) => toSVG(layout(m, G, "bloque", { texts: TEXTOS, queryDate: FECHA, group: g }), { language: "es" })),
      ...grupos.map((g) => toBlockCards(m, G, g, opc)),
      toText(m, G, opc),
      ...m.nodos.map((n) => n.id).sort().map((id) => toCard(m, G, id, opc)),
    ];
  };
  for (const base of [EJEMPLO, P1, CASO])
    it(`${base.sujeto_id}: barajar nodos, flujos y bloques no cambia ni un byte de ninguna salida`, () => {
      const antes = salidas(base);
      fc.assert(
        fc.property(fc.shuffledSubarray(base.nodos, { minLength: base.nodos.length }), fc.shuffledSubarray(base.flujos, { minLength: base.flujos.length }), fc.shuffledSubarray(base.bloques, { minLength: base.bloques.length }), (nodos, flujos, bloques) => {
          expect(salidas({ ...clonar(base), nodos, flujos, bloques })).toEqual(antes);
        }),
        { ...OPC, numRuns: 12 },
      );
    });
});

describe("D11 con flujos al azar entre nodos de capa", () => {
  const capas = new Set(["fuentes", "ingesta", "almacenamiento", "procesamiento", "consumo", "ia"]);
  const ids = EJEMPLO.nodos.filter((n) => capas.has(n.banda_id)).map((n) => n.id);
  const modos = ["por-lotes", "continuo", "a-demanda", "sin-copia"];
  const flujo = fc.record({ o: fc.constantFrom(...ids), d: fc.constantFrom(...ids), modo: fc.constantFrom(...modos) }).filter((x) => x.o !== x.d);
  it("0 cruces en los niveles 1 y 2 con hasta 6 flujos nuevos", () => {
    fc.assert(
      fc.property(fc.array(flujo, { maxLength: 6 }), (nuevos) => {
        const m = clonar(EJEMPLO);
        nuevos.forEach((x, i) => m.flujos.push({ id: `zz-${i}`, origen: x.o, destino: x.d, modo_id: x.modo, que_viaja: { es: "x", en: "x" }, lider: { es: "x", en: "x" } }));
        for (const v of ["nivel-1", "nivel-2"] as const) expect(crossings(disponer(m, v))).toEqual([]);
      }),
      OPC,
    );
  });
});

describe("G5 — quitar flujos no mueve columnas ni franjas en el nivel 1", () => {
  const base = disponer(EJEMPLO, "nivel-1");
  it("columnas, filas y ancho idénticos", () => {
    fc.assert(
      fc.property(fc.subarray(EJEMPLO.flujos), (flujos) => {
        const g: Geometria = disponer({ ...clonar(EJEMPLO), flujos }, "nivel-1");
        expect([g.columnas, g.filas, g.ancho, g.alto]).toEqual([base.columnas, base.filas, base.ancho, base.alto]);
      }),
      OPC,
    );
  });
});

describe("G6 — localidad del cambio (nivel 2)", () => {
  const palabra = fc.string({ unit: fc.constantFrom(..."abcdefghijklmnoprstuv"), minLength: 3, maxLength: 9 });
  const nombre = fc.array(palabra, { minLength: 1, maxLength: 2 }).map((ws) => ws.join(" "));

  it("(a) cambiar el nombre de un nodo cambia solo ese nodo y las referencias que lo nombran", () => {
    const antes = svg(EJEMPLO, "nivel-2");
    fc.assert(
      fc.property(fc.constantFrom(...EJEMPLO.nodos.map((n) => n.id)), nombre, (id, nuevo) => {
        const m = clonar(EJEMPLO);
        m.nodos.find((n) => n.id === id)!.nombre = { es: nuevo, en: nuevo };
        const permitidos = new Set([id, ...m.flujos.filter((f) => f.origen === id || f.destino === id).map((f) => f.id)]);
        for (const c of cambiados(antes, svg(m, "nivel-2"))) expect(permitidos, `cambió ${c}`).toContain(c);
      }),
      OPC,
    );
  });

  it("(b) agregar un nodo al final de una banda que no es la más densa cambia solo ese nodo (y la descripción)", () => {
    const antes = svg(EJEMPLO, "nivel-2");
    fc.assert(
      fc.property(fc.constantFrom("fuentes", "ia"), nombre, (banda, nuevo) => {
        const m = clonar(EJEMPLO);
        m.nodos.push({ ...structuredClone(m.nodos[0]!), id: "zz-nuevo", banda_id: banda, orden: 999, nombre: { es: nuevo, en: nuevo }, bloque_id: undefined });
        delete m.nodos[m.nodos.length - 1]!.bloque_id;
        for (const c of cambiados(antes, svg(m, "nivel-2"))) expect(["zz-nuevo", ""], `cambió ${c}`).toContain(c);
      }),
      OPC,
    );
  });

  it("(c) quitar un flujo cambia ese flujo y solo los que comparten con él un extremo, un canal o la fila de referencias", () => {
    const geo = disponer(EJEMPLO, "nivel-2");
    const antes = toSVG(geo, { language: "es" });
    const canales = (id: string) => {
      const t = geo.trazados.find((x) => x.id === id);
      const out = new Set<number>();
      for (let i = 1; t && i < t.puntos.length; i++) if (t.puntos[i]![0] === t.puntos[i - 1]![0]) out.add(Math.floor((t.puntos[i]![0] - 80 - 1520) / 2020));
      return out;
    };
    const filaRef = (id: string) => geo.rotulos.find((r) => r.id === `r-${id}`)?.caja.y;
    const esSalto = (id: string) => (geo.trazados.find((x) => x.id === id)?.puntos.length ?? 0) >= 5;
    fc.assert(
      fc.property(fc.constantFrom(...EJEMPLO.flujos.map((f) => f.id)), (id) => {
        const f: Flujo = EJEMPLO.flujos.find((x) => x.id === id)!;
        const m = { ...clonar(EJEMPLO), flujos: EJEMPLO.flujos.filter((x) => x.id !== id) };
        const vecinos = EJEMPLO.flujos.filter(
          (g) =>
            g.id === id ||
            [g.origen, g.destino].some((n) => n === f.origen || n === f.destino) ||
            [...canales(g.id)].some((c) => canales(id).has(c)) ||
            (esSalto(g.id) && esSalto(id)) ||
            (filaRef(id) !== undefined && filaRef(g.id) === filaRef(id)),
        );
        const permitidos = new Set(vecinos.map((g) => g.id));
        for (const c of cambiados(antes, toSVG(disponer(m, "nivel-2"), { language: "es" }))) expect(permitidos, `quitar ${id} cambió ${c}`).toContain(c);
      }),
      { ...OPC, numRuns: EJEMPLO.flujos.length * 3 },
    );
  });
});
