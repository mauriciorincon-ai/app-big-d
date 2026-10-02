// @vitest-environment node
// Aritmética exacta del motor (G1, G2): números canónicos, días civiles sin reloj y métricas en enteros.
import { describe, expect, it } from "vitest";
import { METRICAS_PILOTO } from "../src/index";
import { medidor } from "../src/texto/metricas";
import { diasEntre } from "../src/util/fechas";
import { dividirRedondeando, fmt } from "../src/util/numeros";

describe("fmt — el único formato de número del SVG", () => {
  it.each([
    [0, "0"],
    [-0, "0"],
    [5, "0.5"],
    [-5, "-0.5"],
    [10, "1"],
    [1234, "123.4"],
    [1230, "123"],
    [-11780, "-1178"],
  ])("fmt(%d) = %s", (d, s) => expect(fmt(d)).toBe(s));
  it("rechaza lo que no es un entero en décimas", () => {
    expect(() => fmt(0.5)).toThrow();
    expect(() => fmt(Number.NaN)).toThrow();
  });
  it("redondeo entero con las mitades hacia +∞, como Math.round", () => {
    expect([dividirRedondeando(5, 2), dividirRedondeando(-5, 2), dividirRedondeando(7, 3), dividirRedondeando(-7, 3)]).toEqual([3, -2, 2, -2]);
  });
});

describe("días civiles sin Date", () => {
  it.each([
    ["2026-09-20", "2026-09-26", 6],
    ["2026-09-26", "2026-09-20", -6],
    ["2024-02-28", "2024-03-01", 2],
    ["2023-02-28", "2023-03-01", 1],
    ["1999-12-31", "2000-01-01", 1],
    ["2000-01-01", "2100-01-01", 36525],
  ])("de %s a %s: %d días", (a, b, n) => expect(diasEntre(a, b)).toBe(n));
});

describe("métricas de texto como dato (G15)", () => {
  const m = medidor(METRICAS_PILOTO.fuentes["space-grotesk"]!);
  it("«cabe» es exacto y coherente con el ancho redondeado hacia arriba", () => {
    for (const t of ["Almacén central", "¿De dónde vienen los datos?", "Ñandú"]) {
      const w = m.ancho(t, 16, 700);
      expect(m.cabe(t, 16, 700, w)).toBe(true);
      expect(m.cabe(t, 16, 700, w - 1)).toBe(false);
    }
  });
  it("un carácter fuera de la tabla falla en vez de medir con otra fuente (F-006)", () => {
    expect(() => m.ancho("listo ✓", 13, 400)).toThrow(/fuera de la tabla/);
  });
  it("abrevia por palabras con «…» hasta caber (D6)", () => {
    const max = m.ancho("Vista previa…", 12, 400);
    expect(m.abreviar("Vista previa pública", 12, 400, max)).toBe("Vista previa…");
    expect(m.abreviar("Beta", 12, 400, max)).toBe("Beta");
  });
});
