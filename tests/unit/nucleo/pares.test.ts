// @vitest-environment node
// D7 (S8): los pesos por comparación de pares en enteros. Un oráculo en flotantes (solo aquí, en la prueba) acota el
// error del punto fijo; fast-check, con semilla y corridas fijas, prueba la invariancia al orden de los criterios, la suma
// exacta y que una matriz consistente da razón 0.
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import {
  paresCanonicos,
  paresDe,
  pesosPorPares,
  raizEntera,
  type ConvencionPares,
  type Juicio,
} from "@/engine";
import { esquemaConvencionesPares } from "@/lib/datos/conocimiento";

const CONV: ConvencionPares = esquemaConvencionesPares.parse(
  parse(readFileSync("data/convenciones/pares.yaml", "utf8")),
);

/** El oráculo: media geométrica por fila, λ y CR en flotantes. */
function oraculo(ids: string[], juicios: Juicio[]) {
  const xs = [...ids].sort();
  const n = xs.length;
  const a = xs.map(() => xs.map(() => 1));
  for (const j of juicios) {
    const i = xs.indexOf(j.mayor);
    const k = xs.indexOf(j.menor);
    a[i]![k] = j.intensidad;
    a[k]![i] = 1 / j.intensidad;
  }
  const g = a.map((fila) =>
    Math.pow(
      fila.reduce((p, x) => p * x, 1),
      1 / n,
    ),
  );
  const s = g.reduce((p, x) => p + x, 0);
  const w = g.map((x) => x / s);
  const lambda =
    a.reduce(
      (acc, fila, i) =>
        acc + fila.reduce((t, x, k) => t + x * w[k]!, 0) / w[i]!,
      0,
    ) / n;
  const ia = CONV.indice_aleatorio.find((x) => x.n === n)?.milesimas ?? 0;
  const cr =
    n <= 2 ? null : (Math.max(0, lambda - n) / (n - 1) / (ia / 1000)) * 1000;
  return { w: w.map((x) => x * 10_000), lambda: lambda * 1000, cr };
}

const juiciosDe = (ids: string[], valores: number[]): Juicio[] =>
  paresCanonicos(ids).map(([a, b], i) => {
    const v = valores[i % valores.length]!;
    return v >= 0
      ? { mayor: a, menor: b, intensidad: v + 1 }
      : { mayor: b, menor: a, intensidad: -v + 1 };
  });

const IDS = Array.from(
  { length: 11 },
  (_, i) => `crit-${String.fromCharCode(97 + i)}`,
);

describe("raizEntera", () => {
  it("es ⌊x^(1/n)⌋ exacta", () => {
    for (const [x, n, r] of [
      [0, 3, 0],
      [1, 5, 1],
      [26, 3, 2],
      [27, 3, 3],
      [28, 3, 3],
      [1_000_000, 2, 1_000],
      [999_999, 2, 999],
    ] as const)
      expect(raizEntera(BigInt(x), n)).toBe(BigInt(r));
    const grande = BigInt("1" + "0".repeat(132));
    expect(raizEntera(grande, 11)).toBe(BigInt("1" + "0".repeat(12)));
    expect(raizEntera(grande - BigInt(1), 11)).toBe(BigInt("9".repeat(12)));
  });
  it("rechaza x negativo o n < 1", () => {
    expect(() => raizEntera(BigInt(-1), 2)).toThrow(/x ≥ 0/);
    expect(() => raizEntera(BigInt(4), 0)).toThrow(/n ≥ 1/);
  });
});

describe("pesosPorPares", () => {
  it("una matriz consistente (a = 2b = 4c) da 4:2:1 y razón 0", () => {
    const r = pesosPorPares(
      ["crit-c", "crit-a", "crit-b"],
      [
        { mayor: "crit-a", menor: "crit-b", intensidad: 2 },
        { mayor: "crit-b", menor: "crit-c", intensidad: 2 },
        { mayor: "crit-a", menor: "crit-c", intensidad: 4 },
      ],
      CONV,
    );
    expect(r).toEqual({
      tipo: "completa",
      pesos: [
        { criterio_id: "crit-a", peso_centesimas: 5714 },
        { criterio_id: "crit-b", peso_centesimas: 2857 },
        { criterio_id: "crit-c", peso_centesimas: 1429 },
      ],
      lambda_milesimas: 3000,
      razon_milesimas: 0,
      consistente: true,
    });
  });

  it("una matriz muy inconsistente (a > b > c > a) pasa el umbral y avisa", () => {
    const r = pesosPorPares(
      ["crit-a", "crit-b", "crit-c"],
      [
        { mayor: "crit-a", menor: "crit-b", intensidad: 9 },
        { mayor: "crit-b", menor: "crit-c", intensidad: 9 },
        { mayor: "crit-c", menor: "crit-a", intensidad: 9 },
      ],
      CONV,
    );
    expect(
      r.tipo === "completa" && r.razon_milesimas! > CONV.umbral_razon_milesimas,
    ).toBe(true);
    expect(r.tipo === "completa" && r.consistente).toBe(false);
  });

  it("con un par sin juzgar no inventa nada: dice cuántos faltan", () => {
    expect(pesosPorPares(IDS, juiciosDe(IDS, [1]).slice(0, 50), CONV)).toEqual({
      tipo: "incompleta",
      faltan: 5,
      total: 55,
    });
    expect(paresDe(11)).toBe(55);
  });

  it("con uno o dos criterios no hay razón (toda matriz es consistente)", () => {
    expect(pesosPorPares(["crit-a"], [], CONV)).toEqual({
      tipo: "completa",
      pesos: [{ criterio_id: "crit-a", peso_centesimas: 10_000 }],
      lambda_milesimas: 1000,
      razon_milesimas: null,
      consistente: true,
    });
    const dos = pesosPorPares(
      ["crit-b", "crit-a"],
      [{ mayor: "crit-b", menor: "crit-a", intensidad: 3 }],
      CONV,
    );
    expect(dos).toMatchObject({
      tipo: "completa",
      pesos: [
        { criterio_id: "crit-a", peso_centesimas: 2500 },
        { criterio_id: "crit-b", peso_centesimas: 7500 },
      ],
      razon_milesimas: null,
      consistente: true,
    });
  });

  it("rechaza un criterio ajeno, un par repetido, una intensidad fuera de escala y un n sin índice aleatorio", () => {
    const base = [{ mayor: "crit-a", menor: "crit-b", intensidad: 2 }];
    expect(() =>
      pesosPorPares(
        ["crit-a", "crit-b"],
        [{ mayor: "crit-a", menor: "crit-z", intensidad: 2 }],
        CONV,
      ),
    ).toThrow(/no es un par de criterios del caso/);
    expect(() =>
      pesosPorPares(
        ["crit-a", "crit-b"],
        [...base, { mayor: "crit-b", menor: "crit-a", intensidad: 3 }],
        CONV,
      ),
    ).toThrow(/se juzga dos veces/);
    expect(() =>
      pesosPorPares(
        ["crit-a", "crit-b"],
        [{ ...base[0]!, intensidad: 10 }],
        CONV,
      ),
    ).toThrow(/fuera de 1–9/);
    expect(() =>
      pesosPorPares(
        ["crit-a", "crit-b"],
        [{ ...base[0]!, intensidad: 1.5 }],
        CONV,
      ),
    ).toThrow(/fuera de 1–9/);
    expect(() => pesosPorPares(["crit-a", "crit-a"], [], CONV)).toThrow(
      /dos veces/,
    );
    expect(() => pesosPorPares([], [], CONV)).toThrow(/al menos un criterio/);
    expect(() =>
      pesosPorPares(
        ["crit-a", "crit-b", "crit-c"],
        juiciosDe(["crit-a", "crit-b", "crit-c"], [0]),
        { ...CONV, indice_aleatorio: [] },
      ),
    ).toThrow(/n = 3/);
  });

  const valores = fc.array(fc.integer({ min: -8, max: 8 }), {
    minLength: 1,
    maxLength: 55,
  });
  const n = fc.integer({ min: 1, max: 11 });

  it("los enteros siguen al oráculo en flotantes: ±1 centésima por peso, ±1 milésima en λ y en la razón", () => {
    fc.assert(
      fc.property(n, valores, (k, vs) => {
        const ids = IDS.slice(0, k);
        const js = juiciosDe(ids, vs);
        const r = pesosPorPares(ids, js, CONV);
        const o = oraculo(ids, js);
        if (r.tipo !== "completa") return false;
        r.pesos.forEach((p, i) =>
          expect(Math.abs(p.peso_centesimas - o.w[i]!)).toBeLessThanOrEqual(1),
        );
        expect(Math.abs(r.lambda_milesimas - o.lambda)).toBeLessThanOrEqual(1);
        if (o.cr === null) expect(r.razon_milesimas).toBeNull();
        else expect(Math.abs(r.razon_milesimas! - o.cr)).toBeLessThanOrEqual(1);
        return true;
      }),
      { seed: 20261111, numRuns: 150 },
    );
  });

  it("invariancia al orden: reordenar los criterios y los juicios (y voltear un juicio de igualdad) no cambia ningún byte; la suma es 10 000", () => {
    fc.assert(
      fc.property(
        n,
        valores,
        fc.integer({ min: 0, max: 1_000_000 }),
        (k, vs, semilla) => {
          const ids = IDS.slice(0, k);
          const js = juiciosDe(ids, vs);
          const r = pesosPorPares(ids, js, CONV);
          const mezcla = <T>(xs: T[]) =>
            xs
              .map((x, i) => ({ x, o: (i * 7919 + semilla) % 1_000_003 }))
              .sort((a, b) => a.o - b.o)
              .map((y) => y.x);
          const volteados = js.map((j) =>
            j.intensidad === 1
              ? { mayor: j.menor, menor: j.mayor, intensidad: 1 }
              : j,
          );
          const r2 = pesosPorPares(
            mezcla([...ids]).reverse(),
            mezcla(volteados),
            CONV,
          );
          expect(JSON.stringify(r2)).toBe(JSON.stringify(r));
          if (r.tipo === "completa")
            expect(r.pesos.reduce((s, p) => s + p.peso_centesimas, 0)).toBe(
              10_000,
            );
        },
      ),
      { seed: 20261112, numRuns: 200 },
    );
  });

  it("una matriz consistente por construcción (a_ij = v_i / v_j con v en 1–3) da razón 0 y λ = n", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(1, 3, 9), { minLength: 3, maxLength: 9 }),
        (vs) => {
          const ids = IDS.slice(0, vs.length);
          const js = paresCanonicos(ids)
            .map(
              ([a, b]) =>
                [a, b, vs[ids.indexOf(a)]!, vs[ids.indexOf(b)]!] as const,
            )
            .map(([a, b, va, vb]) =>
              va >= vb
                ? { mayor: a, menor: b, intensidad: va / vb }
                : { mayor: b, menor: a, intensidad: vb / va },
            );
          const r = pesosPorPares(ids, js, CONV);
          expect(r).toMatchObject({
            tipo: "completa",
            razon_milesimas: 0,
            consistente: true,
          });
          const l = r.tipo === "completa" ? r.lambda_milesimas : -1;
          expect(l === vs.length * 1000 || l === vs.length * 1000 - 1).toBe(
            true,
          );
        },
      ),
      { seed: 20261113, numRuns: 100 },
    );
  });
});
