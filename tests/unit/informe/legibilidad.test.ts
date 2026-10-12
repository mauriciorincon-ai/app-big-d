// @vitest-environment node
// El presupuesto de lectura (S6, E-13, regla dura 11): palabras exactas, sílabas por reglas fijas declaradas en el código y
// términos a explicar como palabra completa. Contar sílabas no tiene regla exacta, así que el conteo se ata a palabras de
// referencia con su respuesta conocida, en cada idioma, y a propiedades que valen para cualquier texto.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  contieneTermino,
  medirLectura,
  NUMERO_SILABAS,
  palabrasDe,
  silabasDe,
  silabasEn,
  silabasEs,
  type PresupuestoDeLectura,
  type TerminoAExplicar,
} from "@/engine";

const PRESUPUESTO: PresupuestoDeLectura = {
  palabras_max: 50,
  silabas_max: 95,
  terminos_max: 1,
};
const TERMINOS: TerminoAExplicar[] = [
  { id: "empate", formas: ["empate técnico", "empates técnicos"] },
  { id: "catalogo", formas: ["catálogo"] },
  { id: "cdc", formas: ["cdc"] },
];

describe("palabras: exactas, con números y apóstrofos", () => {
  it("separa por todo lo que no es letra ni dígito, y un decimal es una palabra", () => {
    expect(palabrasDe("Norte (78,8) y Ejemplo: 3,0 puntos.")).toEqual([
      "Norte",
      "78,8",
      "y",
      "Ejemplo",
      "3,0",
      "puntos",
    ]);
    expect(palabrasDe("R-1 · alta — sin mitigación")).toEqual([
      "R",
      "1",
      "alta",
      "sin",
      "mitigación",
    ]);
    expect(palabrasDe("it's the team's")).toEqual(["it's", "the", "team's"]);
    expect(palabrasDe("")).toEqual([]);
    expect(palabrasDe(" … — ")).toEqual([]);
  });
});

describe("sílabas en español: palabras de referencia", () => {
  const REF: [string, number][] = [
    // grupos vocálicos y diptongos
    ["empate", 3],
    ["técnico", 3],
    ["gobierno", 3],
    ["evidencia", 4],
    ["dependencia", 4],
    ["decisión", 3],
    ["ciudad", 2],
    ["agua", 2],
    ["pingüino", 3],
    ["estudiáis", 3],
    // hiatos: dos fuertes, o una débil acentuada
    ["caer", 2],
    ["creer", 2],
    ["área", 3],
    ["país", 2],
    ["oído", 3],
    ["leíamos", 4],
    ["continúa", 4],
    ["ahí", 2],
    ["actuar", 2],
    // «qu» y «gu» ante e/i no cuentan la u
    ["que", 1],
    ["quién", 1],
    ["guerra", 2],
    ["guiso", 2],
    // la «y»: vocal débil al final tras vocal; conjunción sola
    ["muy", 1],
    ["hay", 1],
    ["rey", 1],
    ["y", 1],
    ["mayo", 2],
    // siglas sin vocales se deletrean; mayúsculas y minúsculas dan lo mismo
    ["SQL", 3],
    ["CDC", 3],
    ["Catálogo", 4],
    ["CATÁLOGO", 4],
    ["una", 2],
    ["decidan", 3],
    ["catálogo", 4],
    ["riesgos", 2],
    ["mitigación", 4],
    ["supuesto", 3],
  ];
  it.each(REF)("«%s» tiene %i", (palabra, n) =>
    expect(silabasEs(palabra)).toBe(n),
  );
});

describe("sílabas en inglés: palabras de referencia y correcciones declaradas", () => {
  const REF: [string, number][] = [
    ["the", 1],
    ["make", 1],
    ["table", 2],
    ["little", 2],
    ["people", 2],
    ["because", 2],
    ["evidence", 3],
    ["decision", 3],
    ["platform", 2],
    ["risk", 1],
    // «es» y «ed» finales mudas, salvo tras sibilante o t/d
    ["makes", 1],
    ["places", 2],
    ["boxes", 2],
    ["planned", 1],
    ["wanted", 2],
    ["needed", 2],
    // la «y» inicial ante vocal es consonante; en otro sitio es vocal
    ["yes", 1],
    ["you", 1],
    ["happy", 2],
    ["system", 2],
    ["tie", 1],
    ["SQL", 3],
    ["don't", 1],
  ];
  it.each(REF)("«%s» tiene %i", (palabra, n) =>
    expect(silabasEn(palabra)).toBe(n),
  );
});

describe("medirLectura", () => {
  it("un número cuenta una palabra y NUMERO_SILABAS sílabas", () => {
    expect(silabasDe("78,8", "es")).toBe(NUMERO_SILABAS);
    expect(silabasDe("2026", "en")).toBe(NUMERO_SILABAS);
    const l = medirLectura("Norte 78,8", "es", PRESUPUESTO, []);
    expect(l).toMatchObject({
      palabras: 2,
      silabas: 2 + NUMERO_SILABAS,
      cumple: true,
    });
  });

  it("cumple con palabras O con sílabas, y falla solo si no cumple ninguna", () => {
    const corto = Array(40).fill("casa").join(" "); // 40 palabras, 80 sílabas
    expect(medirLectura(corto, "es", PRESUPUESTO, [])).toMatchObject({
      palabras: 40,
      silabas: 80,
      por_palabras: true,
      por_silabas: true,
      cumple: true,
    });
    const largo = Array(60).fill("sí").join(" "); // 60 palabras, 60 sílabas: pasa por sílabas
    expect(medirLectura(largo, "es", PRESUPUESTO, [])).toMatchObject({
      por_palabras: false,
      por_silabas: true,
      cumple: true,
    });
    const pasado = Array(60).fill("casa").join(" "); // 60 palabras, 120 sílabas
    expect(medirLectura(pasado, "es", PRESUPUESTO, [])).toMatchObject({
      por_palabras: false,
      por_silabas: false,
      cumple: false,
    });
  });

  it("los términos a explicar cuentan una vez cada uno, como palabra completa y sin distinguir mayúsculas", () => {
    expect(
      medirLectura(
        "El Catálogo manda. El catálogo es uno.",
        "es",
        PRESUPUESTO,
        TERMINOS,
      ).terminos,
    ).toEqual(["catalogo"]);
    expect(
      medirLectura("Hay un empate técnico.", "es", PRESUPUESTO, TERMINOS),
    ).toMatchObject({ terminos: ["empate"], terminos_ok: true, cumple: true });
    // un solo término pasa; dos, no
    const dos = medirLectura(
      "Un empate técnico en el catálogo.",
      "es",
      PRESUPUESTO,
      TERMINOS,
    );
    expect(dos).toMatchObject({
      terminos: ["empate", "catalogo"],
      terminos_ok: false,
      cumple: false,
    });
    // palabra completa: «cdc» no está dentro de «cdcs»
    expect(
      medirLectura("Los cdcs", "es", PRESUPUESTO, TERMINOS).terminos,
    ).toEqual([]);
    expect(contieneTermino("el CDC.", "cdc")).toBe(true);
    expect(contieneTermino("el catálogos", "catálogo")).toBe(false);
    expect(contieneTermino("Un empate Técnico", "empate técnico")).toBe(true);
  });

  it("el máximo de términos viene del dato: con 0, cualquiera falla", () => {
    expect(
      medirLectura(
        "Un empate técnico",
        "es",
        { ...PRESUPUESTO, terminos_max: 0 },
        TERMINOS,
      ).cumple,
    ).toBe(false);
    expect(
      medirLectura(
        "Un empate técnico",
        "es",
        { ...PRESUPUESTO, terminos_max: 2 },
        TERMINOS,
      ).cumple,
    ).toBe(true);
  });
});

describe("propiedades (fast-check, semilla y corridas fijas)", () => {
  const letras = fc.stringMatching(/^[a-záéíóúüñ]{1,12}$/);
  const palabra = fc.oneof(letras, fc.stringMatching(/^[a-z]{1,10}$/));
  const texto = fc.array(palabra, { maxLength: 30 }).map((p) => p.join(" "));
  const config = { seed: 20261011, numRuns: 300 };

  it("las palabras son aditivas al unir dos textos con un espacio", () => {
    fc.assert(
      fc.property(
        texto,
        texto,
        (a, b) =>
          palabrasDe(`${a} ${b}`).length ===
          palabrasDe(a).length + palabrasDe(b).length,
      ),
      config,
    );
  });

  it("cada palabra tiene al menos una sílaba, en los dos idiomas", () => {
    fc.assert(
      fc.property(palabra, (p) => silabasEs(p) >= 1 && silabasEn(p) >= 1),
      config,
    );
    fc.assert(
      fc.property(texto, (t) =>
        ["es", "en"].every(
          (i) =>
            medirLectura(t, i as "es" | "en", PRESUPUESTO, []).silabas >=
            palabrasDe(t).length,
        ),
      ),
      config,
    );
  });

  it("las sílabas son aditivas al unir dos textos", () => {
    fc.assert(
      fc.property(
        texto,
        texto,
        fc.constantFrom("es" as const, "en" as const),
        (a, b, i) => {
          const s = (t: string) => medirLectura(t, i, PRESUPUESTO, []).silabas;
          return s(`${a} ${b}`) === s(a) + s(b);
        },
      ),
      config,
    );
  });

  it("el veredicto es monótono en el presupuesto: ensanchar nunca hace fallar lo que cumplía", () => {
    fc.assert(
      fc.property(
        texto,
        fc.nat(60),
        fc.nat(120),
        fc.nat(3),
        (t, dp, ds, dt) => {
          const ancho: PresupuestoDeLectura = {
            palabras_max: PRESUPUESTO.palabras_max + dp,
            silabas_max: PRESUPUESTO.silabas_max + ds,
            terminos_max: PRESUPUESTO.terminos_max + dt,
          };
          return (
            !medirLectura(t, "es", PRESUPUESTO, TERMINOS).cumple ||
            medirLectura(t, "es", ancho, TERMINOS).cumple
          );
        },
      ),
      config,
    );
  });

  it("las mayúsculas no cambian ni palabras, ni sílabas, ni términos", () => {
    fc.assert(
      fc.property(texto, (t) => {
        const a = medirLectura(t, "es", PRESUPUESTO, TERMINOS);
        const b = medirLectura(t.toUpperCase(), "es", PRESUPUESTO, TERMINOS);
        return (
          a.palabras === b.palabras &&
          a.silabas === b.silabas &&
          a.terminos.join() === b.terminos.join()
        );
      }),
      config,
    );
  });
});
