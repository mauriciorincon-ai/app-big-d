import { describe, expect, it } from "vitest";
import { racional } from "@/engine";
import { brecha, decimas, entero, huellaCorta, lista, ordinal, peso, porcentaje, porMil, puntos, puntosRacional, semiamplitud } from "@/lib/caso/formato";

// Los números del núcleo en pantalla (regla 1 del motor): el total se redondea a la décima, la brecha y la aceptabilidad
// se truncan, y el separador es el del idioma, sin Intl.
describe("formato de los números del caso", () => {
  it("el total redondea a la décima: 31 500 unidades con máximo 4 son 78,8 (78,75)", () => {
    expect(puntos(31_500, 4, "es")).toBe("78,8");
    expect(puntos(31_500, 4, "en")).toBe("78.8");
    expect(puntos(0, 4, "es")).toBe("0,0");
    expect(puntos(40_000, 4, "es")).toBe("100,0");
  });

  it("la brecha se trunca: 4,9975 puntos jamás se lee «5,0»", () => {
    expect(brecha(1999, 4, "es")).toBe("4,9");
    expect(brecha(1200, 4, "es")).toBe("3,0");
  });

  it("la aceptabilidad se trunca: 69,96 % se lee «69,9», nunca «70,0»", () => {
    expect(porcentaje(6996, 10_000, "es")).toBe("69,9");
    expect(porcentaje(10_000, 10_000, "en")).toBe("100.0");
    expect(porMil(6996, 10_000)).toBe(699);
    // Créditos grandes (K·L con L = mcm(1..18)) no pierden exactitud.
    expect(porcentaje(12_252_240 * 9_940, 12_252_240 * 10_000, "es")).toBe("99,4");
  });

  it("un total racional de la sensibilidad se redondea igual que uno entero", () => {
    expect(puntosRacional(racional(31_500), 4, "es")).toBe("78,8");
    expect(puntosRacional(racional(2_950_000, 99), 4, "es")).toBe(puntos(29_798, 4, "es"));
  });

  it("los pesos en centésimas se escriben en puntos, con los decimales que tengan", () => {
    expect(peso(2500, "es")).toBe("25");
    expect(peso(1480, "es")).toBe("14,8");
    expect(peso(1475, "en")).toBe("14.75");
    expect(peso(5, "es")).toBe("0,05");
    expect(peso(10_000, "es")).toBe("100");
  });

  it("enteros con separador de miles desde cinco cifras, décimas negativas y semiamplitud", () => {
    expect(entero(10_000, "es")).toBe("10 000");
    expect(entero(10_000, "en")).toBe("10,000");
    expect(entero(4000, "es")).toBe("4000");
    expect(entero(-12_345, "en")).toBe("−12,345");
    expect(decimas(-15, "es")).toBe("−1,5");
    expect(semiamplitud(87, "es")).toBe("0,8");
  });

  it("ordinales, listas y huellas", () => {
    expect([1, 2, 3, 4].map((k) => ordinal(k, "es"))).toEqual(["1.er", "2.º", "3.er", "4.º"]);
    expect([1, 2, 3, 4, 11, 12, 13, 21].map((k) => ordinal(k, "en"))).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st"]);
    expect(lista([], " y ")).toBe("");
    expect(lista(["A"], " y ")).toBe("A");
    expect(lista(["A", "B", "C"], " and ")).toBe("A, B and C");
    expect(huellaCorta("25b0113a" + "0".repeat(52) + "5b73")).toEqual({ inicio: "25b011", fin: "5b73" });
  });
});
