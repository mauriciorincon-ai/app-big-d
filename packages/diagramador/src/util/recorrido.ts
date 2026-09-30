// De qué paso sigue cada paso de un recorrido (§ 4.3): el que nombra `sigue_de` o, sin él, el anterior en la
// lista. Lo usan V5, la numeración del motor y la app (B-40 de la auditoría del S1: la misma rama estaba
// escrita en el validador, en el motor y dos veces en la app).
import type { Paso, Recorrido } from "../tipos";

export function pasoPrevio(r: Recorrido, k: number): Paso | undefined {
  const p = r.pasos[k];
  if (!p) return undefined;
  return p.sigue_de !== undefined ? r.pasos.find((x) => x.id === p.sigue_de) : r.pasos[k - 1];
}
