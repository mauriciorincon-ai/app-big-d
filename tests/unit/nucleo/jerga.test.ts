// @vitest-environment node
// S9 (F1), S10 (F1): el detector de jerga (regla dura 11; decisions/jargon-detector.md § 3). Un test por idioma con una frase llana y una
// llena de jerga; las permitidas y los términos explicados no cuentan. La tabla del dato sale de Google Books Ngram (CC BY 3.0): el crudo
// no está en el repo, así que «es la derivación» se prueba con una muestra fija de líneas y con la huella de los cubos del yaml.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { cuboDeRango, detectarJerga, type TablaDeJerga } from "@/engine";
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
    expect(detectarJerga("Elige la plataforma que mejor sirve a tus decisiones y tus riesgos.", t, [])).toEqual([]);
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

  it("el rango de frecuencia cae en cubos de más usada a más rara", () => {
    expect([1, 1500, 1501, 4000, 4001, 8000, 8001, 12000].map(cuboDeRango)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("data/convenciones/jerga.yaml", () => {
  const derivar = (...args: string[]) => execFileSync("node", ["scripts/jerga/derivar.mjs", ...args], { stdio: "pipe", encoding: "utf8" });

  it("la derivación de la muestra fija de líneas de Ngram da la tabla esperada (curaduría: etiquetas, nombres propios, OCR, otro idioma, piso)", () => {
    const esperada = JSON.parse(readFileSync("tests/fixtures/ngram-muestra/esperada.json", "utf8"));
    expect(JSON.parse(derivar("--muestra"))).toEqual(esperada);
    // Lo que NO debe pasar, dicho por nombre: nombre propio, etiqueta gramatical, rareza bajo el piso, otro idioma.
    expect(Object.keys(esperada.es)).not.toContain("madrid");
    expect(Object.keys(esperada.es)).not.toContain("juan");
    expect(Object.keys(esperada.es)).not.toContain("cardinalidad");
    expect(Object.keys(esperada.en)).not.toContain("les");
  });

  it("el yaml es la derivación: su huella es la de sus cubos, cita Ngram CC BY 3.0 en los dos idiomas y nadie lo editó a mano", () => {
    expect(() => derivar("--comprobar")).not.toThrow();
    expect(k.jerga.fuente.es).toContain("Google Books Ngram · CC BY 3.0");
    expect(k.jerga.fuente.en).toContain("Google Books Ngram · CC BY 3.0");
    for (const idioma of ["es", "en"] as const) expect(Object.keys(k.jerga.cubos[idioma])).not.toContain("lakehouse");
  });

  it("`permitidas` trae solo nombres propios (ninguna palabra común del idioma)", () => {
    for (const idioma of ["es", "en"] as const)
      for (const p of k.jerga.permitidas[idioma]) expect(["bigquery", "databricks", "microsoft", "snowflake"], p).toContain(p);
  });

  it("el resumen del caso real no trae jerga en ninguno de los dos idiomas", async () => {
    const { resumenesConJerga } = await import("@/lib/informe/legible");
    expect(resumenesConJerga(k)).toEqual([]);
  });
});
