// D11 (F-003): ningún tramo de un flujo atraviesa la caja de un nodo que no es su origen ni su destino.
// Prueba geométrica sobre la geometría, en enteros: un tramo ortogonal cruza una caja si entra en su
// interior abierto (tocar un borde no cuenta: los flujos terminan en bordes).
import type { Caja, Geometria, Punto } from "./tipos";

export interface Cruce {
  flujo: string;
  caja: string;
  tramo: [Punto, Punto];
}

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
