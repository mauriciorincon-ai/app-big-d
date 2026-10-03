// D11 (F-003): ningún tramo de un flujo atraviesa la caja de un nodo que no es su origen ni su destino.
// Prueba geométrica sobre la geometría, en enteros: un tramo ortogonal cruza una caja si entra en su
// interior abierto (tocar un borde no cuenta: los flujos terminan en bordes).
import type { Caja, Cruce, Geometria, Punto } from "./tipos";

export type { Cruce };

function cruza(a: Punto, b: Punto, c: Caja): boolean {
  const x1 = Math.min(a[0], b[0]);
  const x2 = Math.max(a[0], b[0]);
  const y1 = Math.min(a[1], b[1]);
  const y2 = Math.max(a[1], b[1]);
  return x1 < c.x + c.w && x2 > c.x && y1 < c.y + c.h && y2 > c.y;
}

export function crossings(geo: Geometria): Cruce[] {
  const out: Cruce[] = [];
  for (const t of geo.trazados)
    for (let i = 1; i < t.puntos.length; i++) {
      const a = t.puntos[i - 1]!;
      const b = t.puntos[i]!;
      for (const c of geo.cajas) if (c.id !== t.origen && c.id !== t.destino && cruza(a, b, c.caja)) out.push({ flujo: t.id, caja: c.id, tramo: [a, b] });
    }
  return out;
}

/** Aire mínimo entre un tramo vertical y el borde de una tarjeta que pasa a su lado: 5 u. */
export const AIRE_PISTA = 50;

export interface Pegado {
  flujo: string;
  caja: string;
  /** Distancia al borde, en décimas. */
  distancia: number;
}

/**
 * Tramos verticales que corren a menos de `AIRE_PISTA` del borde de una caja, a su lado (no la cruzan: eso es
 * D11). La pasada de capturas del S1 lo vio en el primer mapa real: a 2 u, una línea parecía salir de la tarjeta
 * vecina y la flecha que entraba a ella quedaba montada sobre dos líneas.
 */
export function pegados(geo: Geometria): Pegado[] {
  const out: Pegado[] = [];
  for (const t of geo.trazados)
    for (let i = 1; i < t.puntos.length; i++) {
      const a = t.puntos[i - 1]!;
      const b = t.puntos[i]!;
      if (a[0] !== b[0] || a[1] === b[1]) continue;
      const x = a[0];
      const y1 = Math.min(a[1], b[1]);
      const y2 = Math.max(a[1], b[1]);
      for (const c of geo.cajas) {
        if (!(y1 < c.caja.y + c.caja.h && y2 > c.caja.y)) continue;
        const izq = c.caja.x - x;
        const der = x - (c.caja.x + c.caja.w);
        const d = izq >= 0 ? izq : der >= 0 ? der : -1;
        if (d >= 0 && d < AIRE_PISTA) out.push({ flujo: t.id, caja: c.id, distancia: d });
      }
    }
  return out;
}

/** Distancia máxima de una etiqueta de modos a su trazo (§ 5.3, invariante): 30 u. */
export const LEJOS_ETIQUETA = 300;

export interface Lejana {
  flujo: string;
  /** Distancia del centro de la etiqueta a su trazo, en décimas (redondeada hacia arriba). */
  distancia: number;
}

/**
 * Etiquetas de modos a más de 30 u de su propio trazo (§ 5.6 `etiqueta:`): distancia de Chebyshov del centro de la
 * etiqueta al tramo más cercano. Se mide en coordenadas dobladas para que el centro sea entero (G1).
 */
export function lejanas(geo: Geometria): Lejana[] {
  const out: Lejana[] = [];
  for (const r of geo.rotulos) {
    if (!r.id.startsWith("etiqueta ")) continue;
    const t = geo.trazados.find((x) => x.id === r.dueno);
    if (!t || t.puntos.length < 2) continue;
    const px = 2 * r.caja.x + r.caja.w;
    const py = 2 * r.caja.y + r.caja.h;
    let d2 = Number.MAX_SAFE_INTEGER;
    for (let i = 1; i < t.puntos.length; i++) {
      const [x1, y1] = t.puntos[i - 1]!;
      const [x2, y2] = t.puntos[i]!;
      const cx = Math.max(2 * Math.min(x1, x2), Math.min(px, 2 * Math.max(x1, x2)));
      const cy = Math.max(2 * Math.min(y1, y2), Math.min(py, 2 * Math.max(y1, y2)));
      d2 = Math.min(d2, Math.max(Math.abs(px - cx), Math.abs(py - cy)));
    }
    if (d2 > 2 * LEJOS_ETIQUETA) out.push({ flujo: t.id, distancia: Math.ceil(d2 / 2) });
  }
  return out;
}

/** Largo de la punta de flecha (`conFlecha`: triángulo de 9 u con la base 9 u antes del extremo). */
export const PUNTA = 90;

export interface Punta {
  /** Flujo cuya punta de llegada queda sobre una pista ajena. */
  flujo: string;
  /** Flujo dueño de la pista que corre bajo esa punta. */
  pista: string;
}

/**
 * P13: la punta de una flecha de llegada (los últimos 9 u de su último tramo, 4,5 u a cada lado) no puede quedar
 * sobre el tramo vertical de otro flujo. Pasa cuando una pista ajena corre entre la de la llegada y la tarjeta.
 */
export function puntas(geo: Geometria): Punta[] {
  const out: Punta[] = [];
  for (const t of geo.trazados) {
    const n = t.puntos.length;
    if (n < 2) continue;
    const [xa, ya] = t.puntos[n - 2]!;
    const [xz, yz] = t.puntos[n - 1]!;
    if (ya !== yz || xa === xz) continue;
    const x1 = Math.min(xz, xz - Math.sign(xz - xa) * PUNTA);
    const x2 = Math.max(xz, xz - Math.sign(xz - xa) * PUNTA);
    for (const s of geo.trazados) {
      if (s === t) continue;
      for (let i = 1; i < s.puntos.length; i++) {
        const [px, py] = s.puntos[i - 1]!;
        const [qx, qy] = s.puntos[i]!;
        if (px !== qx || py === qy) continue;
        if (px > x1 && px < x2 && Math.min(py, qy) < yz + 45 && Math.max(py, qy) > yz - 45) {
          out.push({ flujo: t.id, pista: s.id });
          break;
        }
      }
    }
  }
  return out;
}
