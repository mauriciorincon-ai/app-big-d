// @vitest-environment node
// Propiedades del núcleo (RF-09.2, técnica-núcleo § 7.3, E-1) con fast-check, semilla y corridas fijas: el mismo
// resultado en cada corrida. Viven en src/lib/instrumento/propiedades.ts y las corre TAMBIÉN el instrumento del build
// (scripts/instrumento/validar.mjs): lo que esta suite prueba es lo que el gate de publicación exige (S4).
import { describe, expect, it } from "vitest";
import { PROPIEDADES } from "@/lib/instrumento/propiedades";

describe("propiedades del núcleo", () => {
  it("son siete, con id único y corridas fijas", () => {
    expect(PROPIEDADES.map((p) => p.id)).toEqual([
      "invariancia-al-orden",
      "reproducibilidad",
      "suma-exacta",
      "monotonia-corregida",
      "limite",
      "independencia-de-alternativas-ajenas",
      "oraculo-de-fuerza-bruta",
    ]);
    expect(PROPIEDADES.map((p) => p.corridas)).toEqual([200, 100, 200, 300, 200, 150, 100]);
  });
  for (const p of PROPIEDADES) it(p.descripcion.es, () => p.correr());
});
