// Puntaje por criterio, total, orden y empate técnico (RF-04.1 a RF-04.4, C11). Todo entero y ordenado por id.
//
// Celda (plataforma × criterio): las evidencias APROBADAS de esa plataforma para la capacidad del criterio (o para el
// criterio transversal). Cada una aporta su puntaje con el TOPE POR MADUREZ ya aplicado (E-15: el tope va antes del
// mínimo). Una sola evidencia da su puntaje; varias, el mínimo de las ESENCIALES (agregación no compensatoria declarada
// en el dato), y la que lo fija es la evidencia limitante. Varias sin ninguna esencial es un dato incompleto: el
// cargador lo rechaza y aquí se lanza, jamás se infiere una regla.

import type { BaseMotor, CasoMotor, Celda, CriterioMotor, EvidenciaMotor, Limitante, Puesto, TopeMadurez, Veredicto } from "./tipos";

export const cmpTexto = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const porId = (a: { id: string }, b: { id: string }) => cmpTexto(a.id, b.id);

/** El puntaje máximo que una evidencia de esa madurez puede aportar a este caso (RF-04.2). */
export function topeDe(madurez: string, topes: readonly TopeMadurez[], aceptaVistaPrevia: boolean): number {
  const t = topes.find((x) => x.madurez === madurez);
  if (!t) throw new Error(`núcleo: la madurez «${madurez}» no está en la tabla de topes`);
  return aceptaVistaPrevia ? t.tope_aceptando_vista_previa : t.tope;
}

/** ¿La evidencia es de la celda (plataforma, criterio)? */
export function esDeCelda(e: EvidenciaMotor, plataforma: string, c: CriterioMotor): boolean {
  if (e.plataforma_id !== plataforma) return false;
  return c.tipo === "capacidad" ? e.capacidad_id === c.capacidad_id : e.criterio_id === c.id;
}

/** El puntaje de una celda, o null si no tiene ninguna evidencia aprobada. */
export function celda(plataforma: string, c: CriterioMotor, base: BaseMotor, aceptaVistaPrevia: boolean): Celda | null {
  const evs = base.evidencias.filter((e) => e.estado === "aprobada" && esDeCelda(e, plataforma, c)).sort(porId);
  if (!evs.length) return null;
  const cuentan = evs.length === 1 ? evs : evs.filter((e) => e.esencial);
  if (!cuentan.length) throw new Error(`núcleo: ${plataforma} · ${c.id} tiene ${evs.length} evidencias y ninguna esencial`);
  const conTope = cuentan.map((e) => ({ e, s: Math.min(e.puntaje, topeDe(e.madurez, base.escala.topes, aceptaVistaPrevia)) }));
  // El mínimo; a igual puntaje, la de menor id (vienen por id: el orden del archivo nunca decide).
  const lim = conTope.reduce((a, b) => (b.s < a.s ? b : a));
  const sinTope = Math.min(...cuentan.map((e) => e.puntaje));
  return { plataforma_id: plataforma, criterio_id: c.id, puntaje: lim.s, sustento: cuentan.map((e) => e.id), limitante: lim.e.id, tope_aplicado: lim.s < sinTope };
}

/** Las plataformas que una restricción eliminatoria saca antes de puntuar (RF-03.4), con cuáles las sacaron. */
export function descartes(caso: CasoMotor, base: BaseMotor): { plataforma_id: string; restricciones: string[] }[] {
  return base.plataformas
    .map((p) => ({ plataforma_id: p.id, restricciones: caso.restricciones.filter((r) => r.elimina.includes(p.id)).map((r) => r.id).sort(cmpTexto) }))
    .filter((d) => d.restricciones.length)
    .sort((a, b) => cmpTexto(a.plataforma_id, b.plataforma_id));
}

/** U = Σ peso × puntaje de una plataforma. */
export function unidades(celdas: readonly Celda[], plataforma: string, pesoDe: ReadonlyMap<string, number>): number {
  return celdas.filter((c) => c.plataforma_id === plataforma).reduce((u, c) => u + pesoDe.get(c.criterio_id)! * c.puntaje, 0);
}

/** El vector leximin de una plataforma: los puntajes de los criterios esenciales del caso, de menor a mayor. */
export function vectorLeximin(celdas: readonly Celda[], plataforma: string, caso: CasoMotor): number[] {
  return caso.pesos
    .filter((p) => p.esencial)
    .map((p) => celdas.find((c) => c.plataforma_id === plataforma && c.criterio_id === p.criterio_id)!.puntaje)
    .sort((a, b) => a - b);
}

/** 1, 0 o −1: el vector leximin `a` es mejor, igual o peor que `b` (el primer valor distinto decide; mayor es mejor). */
function leximin(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! > b[i]! ? 1 : -1;
  return 0;
}

/**
 * El orden: más unidades primero; a igual total, el leximin de los esenciales del caso (solo ordena: dentro de la banda
 * sigue habiendo empate técnico); a igual total y leximin, empate exacto con el puesto compartido y la lista por id.
 */
export function ordenar(totales: readonly { plataforma_id: string; unidades: number; leximin: number[] }[]): Puesto[] {
  const xs = [...totales].sort((a, b) => b.unidades - a.unidades || leximin(b.leximin, a.leximin) || cmpTexto(a.plataforma_id, b.plataforma_id));
  return xs.map((x, i) => {
    let j = i;
    while (j > 0 && xs[j - 1]!.unidades === x.unidades && leximin(xs[j - 1]!.leximin, x.leximin) === 0) j--;
    return { plataforma_id: x.plataforma_id, posicion: j + 1, unidades: x.unidades, leximin: x.leximin };
  });
}

/**
 * RF-04.4: si la brecha entre las dos primeras es menor que el umbral, empate técnico entre todas las que quedan a
 * menos del umbral de la primera; si no, ganadora clara. Con una sola plataforma no hay con quién empatar.
 */
export function veredicto(orden: readonly Puesto[], umbralUnidades: number): Veredicto {
  const [p1, p2] = orden;
  if (!p1) throw new Error("núcleo: veredicto sin plataformas");
  if (!p2) return { tipo: "unica", plataforma_id: p1.plataforma_id };
  const brecha = p1.unidades - p2.unidades;
  if (brecha >= umbralUnidades) return { tipo: "ganadora-clara", plataforma_id: p1.plataforma_id, brecha_unidades: brecha };
  return { tipo: "empate-tecnico", plataformas: orden.filter((p) => p1.unidades - p.unidades < umbralUnidades).map((p) => p.plataforma_id), brecha_unidades: brecha };
}

/**
 * La evidencia limitante de cada plataforma (C § 1.2): la del criterio esencial del caso con el menor puntaje; a igual
 * puntaje, la del criterio de más peso y luego la de menor id. Sin criterios esenciales en el caso, no hay limitante.
 */
export function limitantes(celdas: readonly Celda[], plataformas: readonly string[], caso: CasoMotor): Limitante[] {
  const esenciales = caso.pesos.filter((p) => p.esencial);
  const out: Limitante[] = [];
  for (const p of plataformas) {
    let mejor: { c: Celda; peso: number } | null = null;
    for (const e of esenciales) {
      const c = celdas.find((x) => x.plataforma_id === p && x.criterio_id === e.criterio_id)!;
      const gana = !mejor || c.puntaje < mejor.c.puntaje || (c.puntaje === mejor.c.puntaje && (e.peso > mejor.peso || (e.peso === mejor.peso && cmpTexto(c.criterio_id, mejor.c.criterio_id) < 0)));
      if (gana) mejor = { c, peso: e.peso };
    }
    if (mejor) out.push({ plataforma_id: p, criterio_id: mejor.c.criterio_id, evidencia_id: mejor.c.limitante, puntaje: mejor.c.puntaje });
  }
  return out;
}
