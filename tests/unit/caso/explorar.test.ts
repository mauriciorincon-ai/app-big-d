import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { PesoCaso, Sensibilidad } from "@/engine";
import { consultaExploracion, estadoExploracion, exploracionPorOmision } from "@/lib/caso/estado-exploracion";
import { pesosExplorados } from "@/lib/caso/explorar";

const p = (criterio_id: string, peso: number): PesoCaso => ({ criterio_id, peso, esencial: false, rango_pct: 20 });
const PESOS = [p("crit-a", 2500), p("crit-b", 1200), p("crit-c", 1200), p("crit-d", 5100)];

describe("pesos explorados (reparto por restos mayores)", () => {
  it("el criterio movido vale t, los demás siguen en proporción y todo suma 10 000", () => {
    const x = pesosExplorados(PESOS, "crit-a", 1000);
    expect(x.find((w) => w.criterio_id === "crit-a")!.peso).toBe(1000);
    expect(x.reduce((s, w) => s + w.peso, 0)).toBe(10_000);
    // 9000 / 7500 × (1200, 1200, 5100) = (1440, 1440, 6120): exacto.
    expect(x.map((w) => w.peso)).toEqual([1000, 1440, 1440, 6120]);
  });

  it("a igual resto, el punto que sobra va al de menor id (el orden de la lista no decide)", () => {
    const a = pesosExplorados([p("crit-b", 3000), p("crit-a", 3000), p("crit-z", 4000)], "crit-z", 4001);
    expect(a.map((w) => [w.criterio_id, w.peso])).toEqual([
      ["crit-b", 2999],
      ["crit-a", 3000],
      ["crit-z", 4001],
    ]);
  });

  it("propiedad: con cualquier caso y cualquier t, suma 10 000, respeta t y no se aleja más de 1 de la proporción exacta", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 3000 }), { minLength: 2, maxLength: 12 }), fc.integer({ min: 0, max: 10_000 }), (crudos, t) => {
        const total = crudos.reduce((s, x) => s + x, 0);
        if (total === 0) return;
        // Pesos que suman 10 000 por restos mayores sobre los crudos.
        const base = crudos.map((x) => Math.floor((x * 10_000) / total));
        base[0]! += 10_000 - base.reduce((s, x) => s + x, 0);
        const pesos = base.map((w, i) => p(`crit-${String(i).padStart(2, "0")}`, w));
        if (pesos[0]!.peso === 10_000) return;
        const x = pesosExplorados(pesos, "crit-00", t);
        expect(x.reduce((s, w) => s + w.peso, 0)).toBe(10_000);
        expect(x[0]!.peso).toBe(t);
        const R = 10_000 - pesos[0]!.peso;
        x.slice(1).forEach((w, i) => expect(Math.abs(w.peso * R - pesos[i + 1]!.peso * (10_000 - t))).toBeLessThan(R));
      }),
      { seed: 20261004, numRuns: 300 },
    );
  });

  it("rechaza lo que no se puede repartir", () => {
    expect(() => pesosExplorados(PESOS, "crit-x", 10)).toThrow(/no tiene el criterio/);
    expect(() => pesosExplorados([p("crit-a", 10_000), p("crit-b", 0)], "crit-a", 10)).toThrow(/no está definida/);
    expect(() => pesosExplorados(PESOS, "crit-a", 10_001)).toThrow(/fuera de/);
  });
});

describe("el estado de la exploración en la URL", () => {
  const sens: Sensibilidad[] = [
    { criterio_id: "crit-a", estado: "calculada", peso: 2500, hasta: 5000, eventos: [], inversion_abajo: null, inversion_arriba: null },
    { criterio_id: "crit-b", estado: "calculada", peso: 1200, hasta: 2400, eventos: [], inversion_abajo: null, inversion_arriba: null },
    { criterio_id: "crit-c", estado: "rango-vacio", peso: 0, minimo_que_invierte: null },
  ];
  const pesos = [p("crit-a", 2500), p("crit-b", 1200), p("crit-c", 0), p("crit-d", 6300)];

  it("sin consulta: el criterio de más peso en su peso (a igual peso, el de menor id)", () => {
    expect(exploracionPorOmision(pesos)).toEqual({ criterio: "crit-d", t: 6300 });
    expect(exploracionPorOmision([p("crit-z", 5000), p("crit-y", 5000)])).toEqual({ criterio: "crit-y", t: 5000 });
    expect(estadoExploracion("", pesos, sens, 10)).toEqual({ criterio: "crit-d", t: 6300 });
  });

  it("una consulta válida se respeta; una que no cabe cae al peso del perfil o al estado por omisión", () => {
    expect(estadoExploracion("?criterio=crit-a&t=1480", pesos, sens, 10)).toEqual({ criterio: "crit-a", t: 1480 });
    expect(estadoExploracion("?criterio=crit-a&t=5010", pesos, sens, 10)).toEqual({ criterio: "crit-a", t: 2500 });
    expect(estadoExploracion("?criterio=crit-a&t=1485", pesos, sens, 10)).toEqual({ criterio: "crit-a", t: 2500 });
    expect(estadoExploracion("?criterio=crit-a&t=-5", pesos, sens, 10)).toEqual({ criterio: "crit-a", t: 2500 });
    expect(estadoExploracion("?criterio=crit-c&t=10", pesos, sens, 10)).toEqual({ criterio: "crit-c", t: 0 });
    expect(estadoExploracion("?criterio=crit-x&t=10", pesos, sens, 10)).toEqual({ criterio: "crit-d", t: 6300 });
  });

  it("la consulta guarda solo lo que se aparta de la omisión y no toca otros parámetros", () => {
    expect(consultaExploracion({ criterio: "crit-a", t: 1480 }, pesos, "?x=1")).toBe("?x=1&criterio=crit-a&t=1480");
    expect(consultaExploracion({ criterio: "crit-d", t: 6300 }, pesos, "?criterio=crit-a&t=10")).toBe("");
  });
});
