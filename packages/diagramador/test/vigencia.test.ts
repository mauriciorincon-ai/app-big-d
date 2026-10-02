// @vitest-environment node
// § 4.8 — semáforo de vigencia. La geometría resume la vigencia del mapa y de cada elemento activable con
// el MISMO cálculo que dibuja las insignias (la app lo usa para la píldora del mapa), y la lectura en texto
// dice los días de lo que está por revisar o vencido. Lo vigente no se marca en ninguno de los dos.
import { describe, expect, it } from "vitest";
import { toText } from "../src/index";
import { CASOS, VISTAS, disponer } from "./lib/casos";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const ejemplo = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
// El mapa de ejemplo se verificó el 2026-09-20: 6, 30 y 60 días después.
const FECHAS = { vigente: "2026-09-26", revisar: "2026-10-20", vencido: "2026-11-19" } as const;

describe("vigencia en la geometría", () => {
  it("el mapa de ejemplo: el nodo más viejo manda y cada elemento del nivel 1 lleva su estado", () => {
    for (const [estado, fecha] of Object.entries(FECHAS)) {
      const geo = disponer(ejemplo, "nivel-1", fecha);
      expect(geo.vigencia.estado).toBe(estado);
      expect(geo.vigencia.elementos.map((e) => e.id).sort()).toEqual(geo.cajas.map((c) => c.id).sort());
      for (const e of geo.vigencia.elementos) expect(e.estado).toBe(estado);
    }
    expect(disponer(ejemplo, "nivel-1", FECHAS.vigente).vigencia.dias).toBe(6);
    expect(disponer(ejemplo, "nivel-1", FECHAS.revisar).vigencia.dias).toBe(30);
  });

  it("en el nivel 2 y el recorrido hay un elemento por nodo", () => {
    for (const vista of ["nivel-2", "recorrido"] as const) {
      const geo = disponer(ejemplo, vista);
      expect(geo.vigencia.elementos.map((e) => e.id).sort()).toEqual(ejemplo.nodos.map((n) => n.id).sort());
    }
  });

  it.each(Object.entries(FECHAS))("todo elemento fuera de «vigente» tiene su insignia dibujada, y solo esos (%s)", (_estado, fecha) => {
    for (const c of CASOS) {
      const geo = disponer(c.mapa, c.vista, fecha);
      const conInsignia = geo.rotulos.filter((r) => r.id.startsWith("vigencia ")).map((r) => r.dueno).sort();
      const marcados = geo.vigencia.elementos.filter((e) => e.estado !== "vigente").map((e) => e.id).sort();
      expect(marcados, c.nombre).toEqual(conInsignia);
    }
  });

  it("cada vista del mismo mapa y fecha da el mismo estado del mapa", () => {
    for (const m of EJEMPLOS) {
      const estados = new Set(VISTAS.map((v) => disponer(m, v, FECHAS.revisar).vigencia.estado));
      expect(estados.size, m.sujeto_id).toBe(1);
    }
  });
});

describe("vigencia en la lectura en texto", () => {
  const g = GRAMATICAS[ejemplo.gramatica_id]!;
  const lectura = (fecha: string | undefined, language = "es") => toText(ejemplo, g, { language, texts: TEXTOS, ...(fecha ? { queryDate: fecha } : {}) });
  const nodos = ejemplo.nodos.length;

  it("lo vigente no se marca, y sin fecha no se dice nada", () => {
    expect(lectura(FECHAS.vigente)).not.toContain("verificado hace");
    expect(lectura(undefined)).toBe(lectura(FECHAS.vigente));
  });

  it("por revisar y vencido dicen sus días en cada nodo, en los dos idiomas", () => {
    expect(lectura(FECHAS.revisar).split("Por revisar: verificado hace 30 días.").length - 1).toBe(nodos);
    expect(lectura(FECHAS.vencido).split("Vencido: verificado hace 60 días.").length - 1).toBe(nodos);
    expect(lectura(FECHAS.revisar, "en").split("To review: verified 30 days ago.").length - 1).toBe(nodos);
  });
});
