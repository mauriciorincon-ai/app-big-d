// Sensibilidad de un factor (RF-04.5, E-8, C § 1.3). Se mueve el peso t de un criterio de 0 a min(2w, 10 000) y los
// demás se escalan en proporción para que la suma siga en 10 000. El total de cada plataforma es entonces LINEAL en t:
//
//   U_i(t) = t·s_i + (10 000 − t)·A_i / R,   con R = 10 000 − w y A_i = Σ_{j≠c} w_j·s_ij
//   R·U_i(t) = 10 000·A_i + t·m_i,           con m_i = R·s_i − A_i
//
// Así, todo cambio de puesto o de empate técnico ocurre donde dos rectas se cortan (o donde su distancia vale el
// umbral), en un t racional exacto: no hay barrido ni coma flotante. Entre dos cortes el orden es fijo; el estado justo
// después de un corte sale del valor en el corte y de la pendiente (sin evaluar en un punto medio, cuyo denominador
// crecería). Cada evento se informa con su t exacto y con el primer valor de la rejilla, alejándose del peso actual, en
// que el cambio ya se ve: el que la pantalla muestra y el que se re-sustituye en la prueba (± una décima de punto).

import { comparar, pisoA, racional, seguro, techoA, type Racional } from "./racional";
import type { CasoMotor, Celda, Evento, Sensibilidad, TipoEvento } from "./tipos";

/** La suma de los pesos de un caso, en centésimas. */
export const TOTAL = 10_000;
/** E-8 pide los cambios de 2.º y 3.er lugar además del primero: se vigilan los puestos hasta este. */
export const PUESTOS_VIGILADOS = 3;

interface Recta {
  id: string;
  /** Σ de los demás criterios (unidades con los pesos originales). */
  A: number;
  /** Pendiente escalada: R·s − A. */
  m: number;
}

interface Estado {
  /** Puesto de cada plataforma (1 + cuántas están por encima). */
  puesto: Map<string, number>;
  empate: boolean;
}

function rectas(celdas: readonly Celda[], plataformas: readonly string[], pesoDe: ReadonlyMap<string, number>, criterio: string, w: number): Recta[] {
  const R = TOTAL - w;
  return plataformas.map((id) => {
    let A = 0;
    let s = 0;
    for (const c of celdas)
      if (c.plataforma_id === id) {
        if (c.criterio_id === criterio) s = c.puntaje;
        else A += seguro(pesoDe.get(c.criterio_id)! * c.puntaje);
      }
    return { id, A, m: seguro(R * s - A) };
  });
}

/** Estado exacto en t = a/b: todas las rectas se comparan en el mismo denominador R·b (`bandaR` = banda × R). */
function estadoEn(rs: readonly Recta[], a: number, b: number, bandaR: number): Estado {
  const v = rs.map((r) => seguro(TOTAL * r.A * b + a * r.m));
  const puesto = new Map(rs.map((r, i) => [r.id, 1 + v.filter((x) => x > v[i]!).length]));
  const max = Math.max(...v);
  return { puesto, empate: v.filter((x) => max - x < seguro(bandaR * b)).length >= 2 };
}

/** Estado justo después de t = a/b: el valor en el corte y, a igual valor, la pendiente. */
function estadoTrasCorte(rs: readonly Recta[], a: number, b: number, bandaR: number): Estado {
  const k = rs.map((r) => ({ v: seguro(TOTAL * r.A * b + a * r.m), m: r.m }));
  const mayor = (x: { v: number; m: number }, y: { v: number; m: number }) => x.v > y.v || (x.v === y.v && x.m > y.m);
  const puesto = new Map(rs.map((r, i) => [r.id, 1 + k.filter((x) => mayor(x, k[i]!)).length]));
  const lider = k.reduce((x, y) => (mayor(y, x) ? y : x));
  const lim = seguro(bandaR * b);
  const enBanda = k.filter((x) => lider.v - x.v < lim || (lider.v - x.v === lim && lider.m - x.m < 0));
  return { puesto, empate: enBanda.length >= 2 };
}

const enPuesto = (e: Estado, k: number) =>
  [...e.puesto]
    .filter(([, p]) => p === k)
    .map(([id]) => id)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const puestoDe = (tipo: TipoEvento) => (tipo === "lider" ? 1 : tipo === "puesto-2" ? 2 : tipo === "puesto-3" ? 3 : 0);

/** Lo que un tipo de evento mira de un estado. */
function proyeccion(tipo: TipoEvento, e: Estado): string {
  const k = puestoDe(tipo);
  return k ? enPuesto(e, k).join(",") : e.empate ? "empate" : "";
}

/** Los cortes de cada par de rectas, y sus distancias ± banda, dentro de (0, hasta), sin repetir y en orden. */
function cortes(rs: readonly Recta[], hasta: number, bandaR: number): Racional[] {
  const ts: Racional[] = [];
  const cero = racional(0);
  const tope = racional(hasta);
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++) {
      const dm = rs[i]!.m - rs[j]!.m;
      if (dm === 0) continue;
      const da = seguro(TOTAL * (rs[i]!.A - rs[j]!.A));
      for (const objetivo of [0, bandaR, -bandaR]) {
        const t = racional(seguro(objetivo - da), dm);
        if (comparar(t, cero) > 0 && comparar(t, tope) < 0 && !ts.some((x) => comparar(x, t) === 0)) ts.push(t);
      }
    }
  return ts.sort(comparar);
}

/** El primer valor de la rejilla, desde el corte `p` y alejándose de `w`, cuyo estado ya no es el del lado de `w`. */
function rejillaDe(rs: readonly Recta[], tipo: TipoEvento, p: Racional, arriba: boolean, delLado: string, hasta: number, bandaR: number, paso: number): number | null {
  if (arriba) {
    for (let g = techoA(p, paso); g <= hasta; g += paso) if (proyeccion(tipo, estadoEn(rs, g, 1, bandaR)) !== delLado) return g;
  } else {
    for (let g = pisoA(p, paso); g >= 0; g -= paso) if (proyeccion(tipo, estadoEn(rs, g, 1, bandaR)) !== delLado) return g;
  }
  return null;
}

/** Todos los eventos en [0, hasta], con su rejilla alejándose de `w`. */
function eventos(rs: readonly Recta[], w: number, hasta: number, R: number, banda: number, paso: number): Evento[] {
  const bandaR = seguro(banda * R);
  const puntos = [racional(0), ...cortes(rs, hasta, bandaR), racional(hasta)];
  const tramos = puntos.slice(0, -1).map((p) => estadoTrasCorte(rs, p.n, p.d, bandaR));
  const tipos: TipoEvento[] = ["lider"];
  if (Math.min(PUESTOS_VIGILADOS, rs.length - 1) >= 2) tipos.push("puesto-2");
  if (Math.min(PUESTOS_VIGILADOS, rs.length - 1) >= 3) tipos.push("puesto-3");
  const actual = racional(w);
  const out: Evento[] = [];
  for (let k = 1; k < tramos.length; k++) {
    const p = puntos[k]!;
    const antes = tramos[k - 1]!;
    const despues = tramos[k]!;
    const cambios = tipos.filter((t) => proyeccion(t, antes) !== proyeccion(t, despues));
    if (antes.empate !== despues.empate) cambios.push(despues.empate ? "empate-entra" : "empate-sale");
    const arriba = comparar(p, actual) >= 0;
    for (const tipo of cambios) {
      // Del lado del peso actual se ve el estado de antes (si el corte queda arriba) o el de después (si queda abajo).
      const delLado = proyeccion(tipo, arriba ? antes : despues);
      const k1 = puestoDe(tipo);
      out.push({
        tipo,
        t: p,
        antes: k1 ? enPuesto(antes, k1) : [],
        despues: k1 ? enPuesto(despues, k1) : [],
        rejilla: rejillaDe(rs, tipo, p, arriba, delLado, hasta, bandaR, paso),
      });
    }
  }
  return out;
}

const porCriterio = (a: { criterio_id: string }, b: { criterio_id: string }) => (a.criterio_id < b.criterio_id ? -1 : a.criterio_id > b.criterio_id ? 1 : 0);

/**
 * La sensibilidad de cada criterio del caso para las plataformas evaluadas (al menos dos). `banda` = el umbral del
 * empate técnico en unidades; `paso` = la rejilla de la pantalla, en centésimas.
 */
export function sensibilidadDe(celdas: readonly Celda[], plataformas: readonly string[], caso: CasoMotor, banda: number, paso: number): Sensibilidad[] {
  const pesoDe = new Map(caso.pesos.map((p) => [p.criterio_id, p.peso]));
  return [...caso.pesos].sort(porCriterio).map(({ criterio_id, peso: w }): Sensibilidad => {
    if (w === TOTAL) return { criterio_id, estado: "indefinida", peso: w };
    const R = TOTAL - w;
    const rs = rectas(celdas, plataformas, pesoDe, criterio_id, w);
    if (w === 0) {
      // Rango vacío: [0, 0]. Como información, el menor peso que cambiaría la ganadora en todo [0, 10 000].
      const lider = eventos(rs, 0, TOTAL, R, banda, paso).find((e) => e.tipo === "lider") ?? null;
      return { criterio_id, estado: "rango-vacio", peso: w, minimo_que_invierte: lider };
    }
    const hasta = Math.min(2 * w, TOTAL);
    const evs = eventos(rs, w, hasta, R, banda, paso);
    const lideres = evs.filter((e) => e.tipo === "lider");
    const actual = racional(w);
    return {
      criterio_id,
      estado: "calculada",
      peso: w,
      hasta,
      eventos: evs,
      inversion_abajo: lideres.filter((e) => comparar(e.t, actual) < 0).at(-1) ?? null,
      inversion_arriba: lideres.find((e) => comparar(e.t, actual) >= 0) ?? null,
    };
  });
}

/** Los totales exactos (unidades, como racional) de cada plataforma con el peso del criterio movido a `t`. */
export function totalesCon(celdas: readonly Celda[], plataformas: readonly string[], caso: CasoMotor, criterio: string, t: number): { plataforma_id: string; unidades: Racional }[] {
  const w = caso.pesos.find((p) => p.criterio_id === criterio)!.peso;
  if (w === TOTAL) throw new Error("núcleo: con todo el peso en un criterio, la redistribución no está definida");
  const pesoDe = new Map(caso.pesos.map((p) => [p.criterio_id, p.peso]));
  return rectas(celdas, plataformas, pesoDe, criterio, w).map((r) => ({ plataforma_id: r.id, unidades: racional(seguro(TOTAL * r.A + t * r.m), TOTAL - w) }));
}
