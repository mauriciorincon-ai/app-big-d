// @vitest-environment node
// S9 (F1): el detector de jerga (regla dura 11; decisions/jargon-detector.md § 3). Un test por idioma con una frase llana y una
// llena de jerga; las permitidas y los términos explicados no cuentan; la tabla del dato ES la derivación de los textos del proyecto.
import { execFileSync } from "node:child_process";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { cuboDeCuenta, detectarJerga, type TablaDeJerga } from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";

const k = cargarConocimiento();
const tabla = (idioma: "es" | "en"): TablaDeJerga => ({
  largo_minimo: k.jerga.largo_minimo,
  umbral_cubo: k.jerga.umbral_cubo,
  cubos: k.jerga.cubos[idioma],
});

describe("detectarJerga con la tabla del dato", () => {
  it("es · una frase llana no marca nada y una llena de jerga marca sus palabras", () => {
    const t = tabla("es");
    expect(detectarJerga("Elige la plataforma que mejor encaja con tus decisiones y tus riesgos.", t, [])).toEqual([]);
    expect(detectarJerga("Elige la plataforma por su idempotencia, su cardinalidad y su denormalización.", t, [])).toEqual(["cardinalidad", "denormalización", "idempotencia"]);
  });

  it("en · a plain sentence flags nothing and one full of jargon flags its words", () => {
    const t = tabla("en");
    expect(detectarJerga("Pick the platform that best fits your decisions and your risks.", t, [])).toEqual([]);
    expect(detectarJerga("Pick the platform by its idempotency, its cardinality and its denormalization.", t, [])).toEqual(["cardinality", "denormalization", "idempotency"]);
  });

  it("las permitidas del dato y los términos que el glosario explica no cuentan; los números y las palabras cortas, tampoco", () => {
    const t = tabla("es");
    expect(detectarJerga("Zyxwv gana por 12 puntos.", t, [])).toEqual(["zyxwv"]);
    expect(detectarJerga("Zyxwv gana por 12 puntos.", t, ["ZYXWV"])).toEqual([]);
    expect(detectarJerga("El zyxwv gana.", t, [], ["zyxwv"])).toEqual([]);
    expect(detectarJerga("Es un ox.", t, [])).toEqual([]);
  });

  it("propiedad: el orden de las palabras no cambia la lista, que viene sin repetir y ordenada", () => {
    const t = tabla("es");
    const palabra = fc.constantFrom("zyxwv", "qwrtp", "plataforma", "riesgo", "idempotencia", "decisión");
    fc.assert(
      fc.property(fc.array(palabra, { maxLength: 12 }), (ps) => {
        const a = detectarJerga(ps.join(" "), t, []);
        const b = detectarJerga([...ps].reverse().join(" "), t, []);
        expect(a).toEqual(b);
        expect(a).toEqual([...new Set(a)].sort());
      }),
      { seed: 20261201, numRuns: 100 },
    );
  });

  it("la cuenta de apariciones cae en cubos de más usada a más rara", () => {
    expect([100, 50, 49, 10, 9, 3, 2, 1].map(cuboDeCuenta)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("data/convenciones/jerga.yaml", () => {
  it("es la derivación de los textos del proyecto (nadie la edita a mano) y no trae palabras de un fabricante", () => {
    expect(() => execFileSync("node", ["scripts/jerga/derivar.mjs", "--comprobar"], { stdio: "pipe" })).not.toThrow();
    for (const idioma of ["es", "en"] as const) expect(Object.keys(k.jerga.cubos[idioma])).not.toContain("lakehouse");
  });

  it("el resumen del caso real no trae jerga en ninguno de los dos idiomas", async () => {
    const { resumenesConJerga } = await import("@/lib/informe/legible");
    expect(resumenesConJerga(k)).toEqual([]);
  });
});
