// @vitest-environment node
// La simulación de robustez (RF-04.6, RF-04.7; D-S3-07): el generador es el del anexo A, el muestreo es uniforme y
// exacto sobre los puntos enteros del politopo, los créditos cierran en K·L, los empates exactos se reparten 1/k, el
// resultado no depende del tamaño de paso ni del orden de las plataformas y el tope de intentos falla cerrado.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { avanzar, canonicoEstricto, entradaSimulacion, enteroMenorQue, enZonaGris, evaluar, iniciar, muestras, rangoEntero, resultadoDe, semiamplitud, sfc32, siguiente, simular, type Entrada, type EntradaSimulacion, type Resultado } from "@/engine";
import { futuro } from "./lib/futuro";

const SEMILLA = 20_261_004;
type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
const ev = (e: Entrada) => evaluar(e) as Evaluado;
const entradaFuturo = (cambio: (e: Entrada) => void = () => {}) => {
  const e = futuro();
  cambio(e);
  return entradaSimulacion(e, ev(e))!;
};

describe("sfc32 (anexo A)", () => {
  it("reproduce la sonda del anexo A en Node: «7745,24,2231 | 729275.1796069386»", () => {
    const S = [[4, 3, 2, 3, 4, 2, 3, 1, 2, 3, 4], [3, 4, 3, 2, 3, 3, 2, 3, 3, 2, 3], [2, 3, 4, 4, 2, 3, 3, 2, 4, 3, 2]];
    const w0 = [12, 10, 8, 9, 11, 7, 10, 8, 9, 8, 8];
    const r = sfc32(12_345);
    const rnd = () => siguiente(r) / 4_294_967_296;
    const gana = [0, 0, 0];
    let acc = 0;
    for (let n = 0; n < 10_000; n++) {
      const w = w0.map((x) => x * (1 + 0.2 * (rnd() * 2 - 1)));
      const suma = w.reduce((a, b) => a + b, 0);
      let mejor = -1;
      let bt = -Infinity;
      S.forEach((s, p) => {
        const t = s.reduce((a, x, k) => a + ((w[k]! * 100) / suma) * x, 0) / 4;
        if (t > bt) [bt, mejor] = [t, p];
      });
      gana[mejor]!++;
      acc += bt;
    }
    expect(`${gana.join(",")}|${acc.toString()}`).toBe("7745,24,2231|729275.1796069386");
  });

  it("vectores fijos de la semilla del método", () => {
    const r = sfc32(SEMILLA);
    expect([1, 2, 3, 4, 5].map(() => siguiente(r))).toEqual([322_314_650, 1_041_435_501, 3_826_098_439, 3_515_380_813, 276_338_878]);
  });

  it("un entero acotado cae en [0, n) y los recorre todos", () => {
    const r = sfc32(SEMILLA);
    const vistos = new Set(Array.from({ length: 2_000 }, () => enteroMenorQue(r, 7)));
    expect([...vistos].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

/** Una entrada de simulación sobre un politopo dado, con puntajes cualesquiera (para probar el muestreo). */
const politopo = (pesos: number[], rangos: number[], extra: Partial<EntradaSimulacion> = {}): EntradaSimulacion => ({
  plataformas: ["a", "b"],
  criterios: pesos.map((_, k) => `crit-${k}`),
  puntajes: [pesos.map(() => 4), pesos.map(() => 0)],
  pesos,
  rangos_pct: rangos,
  banda: 2_000,
  semillas: [SEMILLA],
  aceptadas: 1_000,
  tope_intentos: 1_000_000,
  z_centesimas: 196,
  robusta_pct: 70,
  fragil_pct: 50,
  ganadora: "a",
  inversion_en_rango: false,
  ...extra,
});

/** χ² de conteos contra la uniforme. */
const chi2 = (conteos: number[]) => {
  const n = conteos.reduce((a, b) => a + b, 0);
  const e = n / conteos.length;
  return conteos.reduce((s, o) => s + ((o - e) * (o - e)) / e, 0);
};

describe("el muestreo es uniforme y exacto sobre los puntos enteros del politopo (E-2)", () => {
  it("los rangos se redondean hacia dentro y el peso declarado siempre queda dentro", () => {
    expect(rangoEntero(800, 20)).toEqual([640, 960]);
    expect(rangoEntero(4_990, 1)).toEqual([4_941, 5_039]);
    expect(rangoEntero(200, 20)).toEqual([160, 240]);
    expect(rangoEntero(7_000, 50)).toEqual([3_500, 10_000]);
    fc.assert(fc.property(fc.integer({ min: 0, max: 10_000 }), fc.integer({ min: 0, max: 100 }), (w, r) => {
      const [lo, hi] = rangoEntero(w, r);
      expect(lo <= w && w <= hi && lo >= 0 && hi <= 10_000).toBe(true);
    }), { seed: SEMILLA, numRuns: 500 });
  });

  it("χ² sobre un politopo de 21 puntos: todos aparecen y ninguno de más (21 000 muestras)", () => {
    // Fijo 5 000; el segundo en [4 941, 5 039]; el tercero en [0, 20]: el sobrante 59 se reparte en 21 puntos.
    const ws = muestras(politopo([5_000, 4_990, 10], [0, 1, 100], { aceptadas: 21_000 }), 21_000);
    const conteos = new Array<number>(21).fill(0);
    for (const w of ws) conteos[w[2]!]!++;
    expect(conteos.every((c) => c > 0)).toBe(true);
    // χ²(20 g.l.) al 0,1 %: 45,3. Con la semilla fija la prueba no tiembla.
    expect(chi2(conteos)).toBeLessThan(45.3);
  });

  it("las marginales de un politopo de 2 501 puntos son uniformes (χ² de 61 y 41 celdas)", () => {
    // x1 + x2 + x3 = 100 con x2 ≤ 60 y x3 ≤ 40: cada x2 con 41 completaciones y cada x3 con 61.
    const ws = muestras(politopo([5_000, 3_000, 2_000], [1, 1, 1]), 41_000);
    const x2 = new Array<number>(61).fill(0);
    const x3 = new Array<number>(41).fill(0);
    for (const w of ws) {
      x2[w[1]! - 2_970]!++;
      x3[w[2]! - 1_980]!++;
    }
    expect(chi2(x2)).toBeLessThan(99.6); // χ²(60) al 0,1 %
    expect(chi2(x3)).toBeLessThan(73.4); // χ²(40) al 0,1 %
  });

  it("cada muestra suma 10 000 y queda dentro de [lo, hi] (propiedad)", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 10_000 }), { minLength: 0, maxLength: 7 }), fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 8, maxLength: 8 }), (cortes, rangos) => {
        const pesos = [0, ...[...cortes].sort((a, b) => a - b), 10_000].slice(1).map((x, i, xs) => x - (i ? xs[i - 1]! : 0));
        const e = politopo(pesos, rangos.slice(0, pesos.length));
        for (const w of muestras(e, 50)) {
          expect(w.reduce((a, b) => a + b, 0)).toBe(10_000);
          w.forEach((x, k) => {
            const [lo, hi] = rangoEntero(pesos[k]!, e.rangos_pct[k]!);
            expect(x >= lo && x <= hi).toBe(true);
          });
        }
      }),
      { seed: SEMILLA, numRuns: 150 },
    );
  });
});

describe("la simulación del caso de la maqueta", () => {
  const r = simular(entradaFuturo());

  it("Norte queda primera en todas las combinaciones de las cuatro semillas: robusta, estable y sin zona gris", () => {
    expect(r.estado).toBe("completa");
    expect(r.ganadora).toBe("norte");
    expect([r.clase, r.estable, r.frontera]).toEqual(["robusta", true, false]);
    expect(r.semillas.map((s) => s.semilla)).toEqual([20_261_004, 20_261_005, 20_261_006, 20_261_007]);
    const D = r.objetivo * r.L;
    for (const s of r.semillas) {
      expect(s.aceptabilidad[r.plataformas.indexOf("norte")]![0]).toBe(D);
      expect(s.semiamplitud_centesimas).toBe(0);
    }
  });

  it("filas y columnas de la aceptabilidad suman K·L; el vector central suma 10 000 y es null para quien nunca queda primera", () => {
    const D = r.objetivo * r.L;
    for (const s of r.semillas) {
      for (const fila of s.aceptabilidad) expect(fila.reduce((a, b) => a + b, 0)).toBe(D);
      for (let p = 0; p < r.plataformas.length; p++) expect(s.aceptabilidad.reduce((a, f) => a + f[p]!, 0)).toBe(D);
      s.central.forEach((c, i) => (s.aceptabilidad[i]![0] ? expect(c!.reduce((a, b) => a + b, 0)).toBe(10_000) : expect(c).toBeNull()));
    }
  });

  it("el empate técnico también es estable: en más del 99 % de las combinaciones las dos primeras quedan a menos de 5 puntos", () => {
    for (const s of r.semillas) expect(s.cerca * 100).toBeGreaterThan(99 * r.objetivo);
  });

  it("con una inversión dentro de un rango declarado, la misma aceptabilidad ya no es robusta: moderada (RF-04.7)", () => {
    expect(simular({ ...entradaFuturo(), inversion_en_rango: true, aceptadas: 200, semillas: [SEMILLA] }).clase).toBe("moderada");
  });

  it("con el primer puesto empatado no hay ganadora ni clase", () => {
    expect(simular({ ...entradaFuturo(), ganadora: null, aceptadas: 200, semillas: [SEMILLA] })).toMatchObject({ ganadora: null, clase: null, frontera: false });
  });
});

describe("créditos, pasos, orden y tope", () => {
  it("un empate exacto de totales reparte el puesto 1/k: dos plataformas idénticas reciben L/2 en cada puesto", () => {
    const e = politopo([6_000, 4_000], [20, 20], { plataformas: ["a", "b", "c"], puntajes: [[3, 2], [3, 2], [0, 0]], aceptadas: 300 });
    const s = simular(e);
    expect(s.L).toBe(6);
    expect(s.semillas[0]!.aceptabilidad).toEqual([[900, 900, 0], [900, 900, 0], [0, 0, 1_800]]);
  });

  it("el resultado no depende del tamaño de paso (propiedad: el Worker corta donde quiera)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 997 }), (paso) => {
        const e = { ...entradaFuturo(), aceptadas: 300 };
        const s = iniciar(e);
        while (!s.fin) avanzar(s, paso);
        expect(canonicoEstricto(resultadoDe(s))).toBe(canonicoEstricto(simular(e)));
      }),
      { seed: SEMILLA, numRuns: 25 },
    );
  });

  it("reordenar las plataformas de la entrada del caso no cambia la simulación", () => {
    const e = futuro();
    const p = futuro();
    p.base.plataformas.reverse();
    p.base.evidencias.reverse();
    p.caso.pesos.reverse();
    const corta = (x: EntradaSimulacion) => ({ ...x, aceptadas: 300 });
    expect(canonicoEstricto(simular(corta(entradaSimulacion(p, ev(p))!)))).toBe(canonicoEstricto(simular(corta(entradaSimulacion(e, ev(e))!))));
  });

  it("el tope de intentos falla cerrado: sin clase y sin seguir con las otras semillas", () => {
    const r = simular({ ...entradaFuturo(), tope_intentos: 50 });
    expect(r).toMatchObject({ estado: "tope-de-intentos", clase: null, estable: false, frontera: false });
    expect(r.semillas.map((s) => [s.estado, s.intentos])).toEqual([["tope-de-intentos", 50]]);
  });

  it("con una sola plataforma no hay simulación; más de 18 no caben en el crédito exacto", () => {
    const e = futuro();
    e.caso.restricciones = [{ id: "res-x", elimina: ["este", "plataforma-ejemplo", "sur"] }];
    expect(entradaSimulacion(e, ev(e))).toBeNull();
    expect(() => iniciar(politopo([10_000], [0], { plataformas: Array.from({ length: 19 }, (_, i) => `p${i}`), puntajes: Array.from({ length: 19 }, () => [1]) }))).toThrow("hasta 18 plataformas");
    expect(() => iniciar(politopo([5_000, 4_000], [0, 0]))).toThrow("no suman 10 000");
  });
});

describe("zona gris e intervalo, exactos (E-7)", () => {
  it("coinciden con el cálculo en coma flotante lejos del borde", () => {
    const [K, L, z] = [10_000, 6, 196];
    for (let c = 0; c <= K * L; c += 997) {
      const p = c / (K * L);
      const ic = 1.96 * Math.sqrt((p * (1 - p)) / K);
      for (const u of [50, 70]) {
        const dist = Math.abs(p - u / 100);
        if (Math.abs(dist - ic) > 1e-9) expect(enZonaGris(c, K, L, u, z)).toBe(dist < ic);
      }
      expect(semiamplitud(c, K, L, z)).toBe(Math.floor(ic * 10_000 + 1e-9));
    }
  });
});
