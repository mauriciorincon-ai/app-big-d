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
