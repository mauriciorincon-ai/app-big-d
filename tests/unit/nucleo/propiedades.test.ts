// @vitest-environment node
// Propiedades del núcleo (RF-09.2, técnica-núcleo § 7.3, E-1) con fast-check, semilla y corridas fijas: el mismo
// resultado en cada corrida, también dentro del gate de publicación. Las bases son aleatorias: de 1 a 5 plataformas,
// de 1 a 6 criterios, puntajes de 0 a 4 y pesos que suman 10 000 (con ceros y con todo el peso en un criterio).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { canonicoEstricto, comparar, evaluar, racional, TOTAL, totalesCon, type Entrada, type Racional, type Resultado, type Sensibilidad } from "@/engine";

const SEMILLA = 20_261_004;
const opciones = (numRuns: number) => ({ seed: SEMILLA, numRuns });

interface Base {
  puntajes: number[][];
  pesos: number[];
  esenciales: boolean[];
}

/** Pesos enteros que suman 10 000: cortes ordenados en [0, 10 000], o todo el peso en uno. */
const pesos = (k: number): fc.Arbitrary<number[]> =>
  fc.oneof(
    { weight: 4, arbitrary: fc.array(fc.integer({ min: 0, max: TOTAL }), { minLength: k - 1, maxLength: k - 1 }).map((cs) => [0, ...cs.sort((a, b) => a - b), TOTAL].slice(1).map((x, i, xs) => x - (i ? xs[i - 1]! : 0))) },
    { weight: 1, arbitrary: fc.integer({ min: 0, max: k - 1 }).map((i) => Array.from({ length: k }, (_, j) => (j === i ? TOTAL : 0))) },
  );

const base = fc
  .record({ n: fc.integer({ min: 1, max: 5 }), k: fc.integer({ min: 1, max: 6 }) })
  .chain(({ n, k }) =>
    fc.record({
      puntajes: fc.array(fc.array(fc.integer({ min: 0, max: 4 }), { minLength: k, maxLength: k }), { minLength: n, maxLength: n }),
      pesos: pesos(k),
      esenciales: fc.array(fc.boolean(), { minLength: k, maxLength: k }),
    }),
  );

const P = (i: number) => `plat-${String.fromCharCode(97 + i)}`;
const C = (j: number) => `crit-${String.fromCharCode(97 + j)}`;

function entrada(b: Base): Entrada {
  return {
    caso: { id: "propiedad", estado: "aprobado", acepta_vista_previa: false, fecha_evaluacion: "2026-10-04", pesos: b.pesos.map((peso, j) => ({ criterio_id: C(j), peso, esencial: b.esenciales[j]!, rango_pct: 20 })), restricciones: [] },
    base: {
      instantanea: { version: "propiedad", huella: "0".repeat(64) },
      plataformas: b.puntajes.map((_, i) => ({ id: P(i) })),
      criterios: b.pesos.map((_, j) => ({ id: C(j), tipo: "transversal" as const })),
      evidencias: b.puntajes.flatMap((ss, i) => ss.map((s, j) => ({ id: `evi-${P(i)}-${C(j)}`, plataforma_id: P(i), criterio_id: C(j), puntaje: s, madurez: "disponible-general", esencial: true, estado: "aprobada" as const, fecha_verificacion: "2026-10-01" }))),
      escala: { max: 4, topes: [{ madurez: "disponible-general", disponible: true, tope: 4, tope_aceptando_vista_previa: 4 }] },
      convenciones: { umbral_empate_centesimas: 500, vigencia: { revisar_dias: 30, vencido_dias: 60 }, pros_contras: { ancla_destaca: 4, ancla_corta: 2, max_por_lista: 3 }, sensibilidad: { paso_centesimas: 10 } },
    },
  };
}

/** Una permutación por llaves aleatorias (estable). */
const permutar = <T>(xs: readonly T[], llaves: readonly number[]) => xs.map((x, i) => [x, llaves[i % llaves.length]! + i * 1e-9] as const).sort((a, b) => a[1] - b[1]).map(([x]) => x);

type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
type Calculada = Extract<Sensibilidad, { estado: "calculada" }>;

/** R·U_i(t), calculado a mano desde los pesos escalados (no desde las rectas del núcleo): la segunda opinión. */
function escaladoAMano(b: Base, i: number, c: number, t: number): number {
  const R = TOTAL - b.pesos[c]!;
  return b.puntajes[i]!.reduce((u, s, j) => u + (j === c ? t * R : b.pesos[j]! * (TOTAL - t)) * s, 0);
}

const lideresAMano = (b: Base, c: number, t: number) => {
  const v = b.puntajes.map((_, i) => escaladoAMano(b, i, c, t));
  const max = Math.max(...v);
  return v.map((x, i) => (x === max ? P(i) : "")).filter(Boolean).join(",");
};

/**
 * Las líderes justo DESPUÉS del entero t (el tramo, no el punto): por el valor en t y, a igual valor, por la pendiente,
 * que en una recta es la diferencia de un paso. Un empate que solo ocurre en un punto (p. ej., todas en cero en t = 0)
 * no es una inversión dentro del rango.
 */
const lideresTras = (b: Base, c: number, t: number) => {
  const k = b.puntajes.map((_, i) => [escaladoAMano(b, i, c, t), escaladoAMano(b, i, c, t + 1) - escaladoAMano(b, i, c, t)] as const);
  const mayor = (x: readonly [number, number], y: readonly [number, number]) => x[0] > y[0] || (x[0] === y[0] && x[1] > y[1]);
  const top = k.reduce((x, y) => (mayor(y, x) ? y : x));
  return k.map((x, i) => (x[0] === top[0] && x[1] === top[1] ? P(i) : "")).filter(Boolean).join(",");
};

describe("propiedades del núcleo", () => {
  it("invariancia al orden: permutar plataformas, criterios y evidencias no cambia un byte (RF-09.2)", () => {
    fc.assert(
      fc.property(base, fc.array(fc.integer(), { minLength: 1, maxLength: 40 }), (b, llaves) => {
        const e = entrada(b);
        const p: Entrada = {
          caso: { ...e.caso, pesos: permutar(e.caso.pesos, llaves) },
          base: { ...e.base, plataformas: permutar(e.base.plataformas, llaves.slice(1)), criterios: permutar(e.base.criterios, llaves.slice(2)), evidencias: permutar(e.base.evidencias, llaves.slice(3)) },
        };
        expect(canonicoEstricto(evaluar(p))).toBe(canonicoEstricto(evaluar(e)));
      }),
      opciones(200),
    );
  });

  it("reproducibilidad: la misma entrada da el mismo texto canónico, también sobre una copia", () => {
    fc.assert(
      fc.property(base, (b) => {
        const e = entrada(b);
        expect(canonicoEstricto(evaluar(structuredClone(e)))).toBe(canonicoEstricto(evaluar(e)));
      }),
      opciones(100),
    );
  });

  it("suma exacta: con un peso movido a t, los pesos escalados suman 10 000 y el total del núcleo es el de esos pesos", () => {
    fc.assert(
      fc.property(base, fc.nat(), fc.integer({ min: 0, max: TOTAL }), (b, ci, t) => {
        const c = ci % b.pesos.length;
        fc.pre(b.pesos[c]! < TOTAL);
        const R = TOTAL - b.pesos[c]!;
        // Σ pesos escalados × R = t·R + Σ_{j≠c} w_j·(10 000 − t) = 10 000·R, en enteros.
        const suma = b.pesos.reduce((s, w, j) => s + (j === c ? t * R : w * (TOTAL - t)), 0);
        expect(suma).toBe(TOTAL * R);
        const e = entrada(b);
        const r = evaluar(e) as Evaluado;
        const tot = totalesCon(r.celdas, r.evaluadas, e.caso, C(c), t);
        tot.forEach((x, i) => expect(comparar(x.unidades, racional(escaladoAMano(b, i, c, t), R))).toBe(0));
      }),
      opciones(200),
    );
  });

  // E-1: la redacción de la especificación («nunca disminuye su puntaje total relativo») es falsa con la
  // redistribución proporcional; lo que sí vale es que la POSICIÓN de la plataforma con el máximo nunca empeora.
  it("monotonía corregida: si p tiene el máximo en c, subir el peso de c nunca deja más plataformas por encima de p", () => {
    fc.assert(
      fc.property(base, fc.nat(), fc.nat(), fc.integer({ min: 0, max: TOTAL }), fc.integer({ min: 0, max: TOTAL }), (b, ci, pi, x, y) => {
        const c = ci % b.pesos.length;
        const w = b.pesos[c]!;
        fc.pre(w < TOTAL);
        const max = Math.max(...b.puntajes.map((ss) => ss[c]!));
        const p = b.puntajes.findIndex((ss, i) => i >= pi % b.puntajes.length && ss[c] === max);
        fc.pre(p >= 0);
        const [t1, t2] = [w + ((x * (TOTAL - w)) / TOTAL) | 0, w + ((y * (TOTAL - w)) / TOTAL) | 0].sort((a, b) => a - b) as [number, number];
        const e = entrada(b);
        const r = evaluar(e) as Evaluado;
        const u = (t: number) => totalesCon(r.celdas, r.evaluadas, e.caso, C(c), t).map((z) => z.unidades);
        const porEncima = (us: Racional[]) => us.filter((z, q) => q !== p && comparar(z, us[p]!) > 0).length;
        const [u1, u2] = [u(t1), u(t2)];
        expect(porEncima(u2)).toBeLessThanOrEqual(porEncima(u1));
      }),
      opciones(300),
    );
  });

  it("límite: si p es la única con el máximo en c, con todo el peso en c gana p", () => {
    fc.assert(
      fc.property(base, fc.nat(), (b, ci) => {
        const c = ci % b.pesos.length;
        fc.pre(b.pesos[c]! < TOTAL && b.puntajes.length >= 2);
        const ss = b.puntajes.map((x) => x[c]!);
        const max = Math.max(...ss);
        fc.pre(ss.filter((s) => s === max).length === 1);
        const e = entrada(b);
        const r = evaluar(e) as Evaluado;
        const u = totalesCon(r.celdas, r.evaluadas, e.caso, C(c), TOTAL).map((z) => z.unidades);
        const p = ss.indexOf(max);
        u.forEach((z, q) => q !== p && expect(comparar(u[p]!, z)).toBe(1));
      }),
      opciones(200),
    );
  });

  it("independencia de las alternativas ajenas: agregar una plataforma no cambia los totales de las demás", () => {
    fc.assert(
      fc.property(base, fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 6, maxLength: 6 }), (b, nueva) => {
        const antes = evaluar(entrada(b)) as Evaluado;
        const despues = evaluar(entrada({ ...b, puntajes: [...b.puntajes, nueva.slice(0, b.pesos.length)] })) as Evaluado;
        for (const p of antes.orden) expect(despues.orden.find((x) => x.plataforma_id === p.plataforma_id)!.unidades).toBe(p.unidades);
      }),
      opciones(150),
    );
  });

  it("oráculo de fuerza bruta: todo cambio de ganadora entre dos pesos enteros tiene su evento, y la rejilla lo muestra (± una décima)", () => {
    fc.assert(
      fc.property(base, (b) => {
        fc.pre(b.puntajes.length >= 2);
        const r = evaluar(entrada(b)) as Evaluado;
        for (const s of r.sensibilidad) {
          if (s.estado !== "calculada") continue;
          const c = Number(s.criterio_id.charCodeAt(5) - 97);
          const lideres = s.eventos.filter((e) => e.tipo === "lider");
          let previo = lideresTras(b, c, 0);
          for (let t = 1; t < (s as Calculada).hasta; t++) {
            const ahora = lideresTras(b, c, t);
            if (ahora !== previo) expect(lideres.some((e) => comparar(e.t, racional(t - 1)) > 0 && comparar(e.t, racional(t)) <= 0), `${s.criterio_id} entre ${t - 1} y ${t}`).toBe(true);
            previo = ahora;
          }
          for (const e of lideres) {
            if (e.rejilla === null) continue;
            const arriba = comparar(e.t, racional(s.peso)) >= 0;
            const delLado = (arriba ? e.antes : e.despues).join(",");
            expect(lideresAMano(b, c, e.rejilla)).not.toBe(delLado);
            const lejos = Math.abs(e.rejilla * e.t.d - e.t.n) > 10 * e.t.d;
            // Más de una décima de distancia solo si otro evento cae entre el corte y la rejilla.
            if (lejos) expect(s.eventos.some((o) => o !== e && comparar(o.t, e.t) * (arriba ? 1 : -1) > 0 && comparar(o.t, racional(e.rejilla!)) * (arriba ? 1 : -1) <= 0)).toBe(true);
          }
        }
      }),
      opciones(100),
    );
  });
});
