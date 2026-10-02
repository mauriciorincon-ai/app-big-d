// @vitest-environment node
// V16 «el mapa se dibuja» (CONTRATO v0.4.0 § 7) y las cuatro edades de la matriz de envejecimiento (§ 5.6):
// en publicación, todo aviso de geometría en cualquier edad es error; en privado, se informa sin rechazar;
// sin las cadenas de interfaz no corre y el informe lo declara. Y la aritmética de fechas sin `Date` (G2).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { agingDates, validate, type Mapa } from "../src/index";
import { diasEntre, sumarDias } from "../src/util/fechas";
import { COBERTURA, EJEMPLOS, GRAMATICAS, leerJson } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const SEMILLA = 20261002;
const G = GRAMATICAS["plataformas-datos"]!;
const ejemplo = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const P1 = leerJson<Mapa>("carnadas/P1-mapa-denso.mapa.json");
/** El ejemplo con un nombre que no cabe en su bloque del nivel 1 (ni en dos líneas). */
const conNombreLargo = (): Mapa => {
  const m = structuredClone(ejemplo);
  const b = m.bloques[0]!;
  b.nombre = { es: "Superintercomunicabilidadmente ingesta", en: "Superintercommunicationally ingestion" };
  return m;
};

describe("sumarDias sin Date", () => {
  it("casos conocidos: fin de mes, año bisiesto y retroceso", () => {
    expect(sumarDias("2026-09-27", 30)).toBe("2026-10-27");
    expect(sumarDias("2024-02-28", 1)).toBe("2024-02-29");
    expect(sumarDias("2023-02-28", 1)).toBe("2023-03-01");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2000-03-01", -1)).toBe("2000-02-29");
    expect(sumarDias("2026-10-02", 0)).toBe("2026-10-02");
  });
  it("es la inversa de diasEntre en cualquier fecha y salto", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200_000 }), fc.integer({ min: -5000, max: 5000 }), (base, d) => {
        const desde = sumarDias("1900-01-01", base);
        return diasEntre(desde, sumarDias(desde, d)) === d && /^\d{4}-\d{2}-\d{2}$/.test(desde);
      }),
      { seed: SEMILLA, numRuns: 300 },
    );
  });
});

describe("agingDates: las cuatro edades", () => {
  it("hoy, el primer umbral, el segundo y +100 días desde el nodo más viejo", () => {
    const vieja = ejemplo.nodos.map((n) => n.fecha_verificacion).sort()[0]!;
    expect(agingDates(ejemplo, G, "2026-10-02")).toEqual([
      "2026-10-02",
      sumarDias(vieja, G.vigencia.umbral_revisar_dias),
      sumarDias(vieja, G.vigencia.umbral_vencido_dias),
      "2027-01-10",
    ]);
  });
  it("sin fecha de consulta, «hoy» es la verificación más reciente; sin repetir una edad", () => {
    const m = structuredClone(ejemplo);
    for (const n of m.nodos) n.fecha_verificacion = "2026-09-01";
    expect(agingDates(m, G)).toEqual(["2026-09-01", "2026-10-01", "2026-10-31", "2026-12-10"]);
    expect(agingDates(m, G, "2026-10-01")).toEqual(["2026-10-01", "2026-10-31", "2027-01-09"]);
  });
});

describe("V16 · el mapa se dibuja", () => {
  const opc = { coverage: COBERTURA, texts: TEXTOS, queryDate: "2026-10-02" };
  it("el ejemplo y P1 se dibujan sin un aviso en sus cuatro edades", () => {
    for (const m of [ejemplo, P1]) {
      const inf = validate({ ...m, estado: "aprobada" }, G, { mode: "publicacion", ...opc });
      expect(inf.errores, m.sujeto_id).toEqual([]);
      expect(inf.avisos.filter((a) => a.regla === "V16"), m.sujeto_id).toEqual([]);
    }
  });
  it("en publicación, un nombre que no cabe es error V16 con la vista y el aviso", () => {
    const inf = validate({ ...conNombreLargo(), estado: "aprobada" }, G, { mode: "publicacion", ...opc });
    expect(inf.ok).toBe(false);
    expect(inf.errores.length).toBeGreaterThan(0);
    for (const e of inf.errores) {
      expect(e.regla).toBe("V16");
      expect(e.mensaje).toMatch(/^(nivel-1|nivel-2|recorrido \S+|ventana \S+)( · el \d{4}-\d{2}-\d{2})? · /);
    }
  });
  it("en privado, los mismos avisos se informan sin rechazar", () => {
    const inf = validate(conNombreLargo(), G, { mode: "privado", ...opc });
    expect(inf.errores).toEqual([]);
    expect(inf.avisos.some((a) => a.regla === "V16")).toBe(true);
  });
  it("sin las cadenas de interfaz, V16 no corre y el informe lo declara", () => {
    const inf = validate({ ...conNombreLargo(), estado: "aprobada" }, G, { mode: "publicacion", coverage: COBERTURA });
    expect(inf.errores).toEqual([]);
    expect(inf.avisos.map((a) => a.mensaje)).toContain("V16 no corrió: no se entregaron las cadenas de interfaz para dibujar (texts)");
  });
  it("sobre un mapa con errores no dibuja (dibujar uno roto no dice nada nuevo)", () => {
    const roto = { ...conNombreLargo(), estado: "aprobada", nodos: [...ejemplo.nodos, { ...ejemplo.nodos[0]! }] };
    const inf = validate(roto, G, { mode: "publicacion", ...opc });
    expect(inf.errores.some((e) => e.regla === "V16")).toBe(false);
    expect(inf.errores.length).toBeGreaterThan(0);
  });
});
