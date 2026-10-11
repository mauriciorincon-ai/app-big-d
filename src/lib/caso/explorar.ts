import { TOTAL, type PesoCaso } from "@/engine";

/**
 * Los pesos enteros con que se simula un peso explorado (D-S3-06, regla 3 del motor): el criterio movido vale `t` y los
 * demás se reparten en proporción a sus pesos del perfil, por restos mayores (a igual resto, el de menor id) para que
 * sigan sumando 10 000. Los totales y los eventos de la sensibilidad no pasan por aquí: usan la fórmula racional exacta.
 */
export function pesosExplorados(pesos: readonly PesoCaso[], criterio: string, t: number): PesoCaso[] {
  const w = pesos.find((p) => p.criterio_id === criterio)?.peso;
  if (w === undefined) throw new Error(`el caso no tiene el criterio ${criterio}`);
  if (w === TOTAL) throw new Error("con todo el peso en un criterio, la redistribución no está definida");
  if (!Number.isSafeInteger(t) || t < 0 || t > TOTAL) throw new Error(`peso fuera de [0, ${TOTAL}]: ${t}`);
  const R = TOTAL - w;
  const resto = TOTAL - t;
  const otros = pesos.filter((p) => p.criterio_id !== criterio).map((p) => ({ id: p.criterio_id, q: Math.floor((p.peso * resto) / R), r: (p.peso * resto) % R }));
  let falta = resto - otros.reduce((s, x) => s + x.q, 0);
  for (const x of [...otros].sort((a, b) => b.r - a.r || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    if (falta <= 0) break;
    x.q += 1;
    falta -= 1;
  }
  const nuevo = new Map(otros.map((x) => [x.id, x.q]));
  return pesos.map((p) => ({ ...p, peso: p.criterio_id === criterio ? t : nuevo.get(p.criterio_id)! }));
}
