// `diff(mapA, mapB)` (§ 4.7): qué cambió entre dos versiones de un mapa. Nodos nuevos (+), retirados (−),
// renombrados (→, por id o por `nombres_anteriores`) y con madurez cambiada (▮); flujos y pasos nuevos,
// retirados o cambiados. Dato puro, ordenado por id: la app lo dibuja con glifo + palabra (G7).
import type { Flujo, Mapa, Nodo, Paso, TextoIdioma } from "./tipos";
import { compararCodigo } from "./util/orden";

export interface Diferencias {
  nodos: {
    nuevos: string[];
    retirados: string[];
    renombrados: { id: string; antes: TextoIdioma; ahora: TextoIdioma; idAnterior?: string }[];
    madurez: { id: string; antes: string; ahora: string }[];
  };
  flujos: { nuevos: string[]; retirados: string[]; cambiados: string[] };
  pasos: { nuevos: string[]; retirados: string[]; cambiados: string[] };
}

const igual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const iguales = (a: TextoIdioma, b: TextoIdioma): boolean => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);
const porId = <T extends { id: string }>(xs: readonly T[]) => new Map(xs.map((x) => [x.id, x]));
const ordenados = (xs: string[]) => xs.sort(compararCodigo);

function colecciones<T extends { id: string }>(a: readonly T[], b: readonly T[], cambio: (x: T, y: T) => boolean) {
  const A = porId(a);
  const B = porId(b);
  return {
    nuevos: ordenados([...B.keys()].filter((id) => !A.has(id))),
    retirados: ordenados([...A.keys()].filter((id) => !B.has(id))),
    cambiados: ordenados([...B.keys()].filter((id) => A.has(id) && cambio(A.get(id)!, B.get(id)!))),
  };
}

export function diff(mapA: Mapa, mapB: Mapa): Diferencias {
  const A = porId(mapA.nodos);
  const B = porId(mapB.nodos);
  let nuevos = [...B.keys()].filter((id) => !A.has(id));
  let retirados = [...A.keys()].filter((id) => !B.has(id));
  const renombrados: Diferencias["nodos"]["renombrados"] = [];
  // Mismo id, nombre distinto.
  for (const [id, b] of B) {
    const a = A.get(id);
    if (a && !iguales(a.nombre, b.nombre)) renombrados.push({ id, antes: a.nombre, ahora: b.nombre });
  }
  // Id distinto, pero el nodo nuevo declara como nombre anterior el de uno retirado: es un renombre.
  for (const id of [...nuevos]) {
    const b: Nodo = B.get(id)!;
    const previo = retirados.find((r) => (b.nombres_anteriores ?? []).some((n) => iguales(n, A.get(r)!.nombre)));
    if (previo !== undefined) {
      renombrados.push({ id, antes: A.get(previo)!.nombre, ahora: b.nombre, idAnterior: previo });
      nuevos = nuevos.filter((x) => x !== id);
      retirados = retirados.filter((x) => x !== previo);
    }
  }
  const madurez: Diferencias["nodos"]["madurez"] = [];
  for (const [id, b] of B) {
    const a = A.get(id) ?? A.get(renombrados.find((r) => r.id === id)?.idAnterior ?? "");
    if (a && a.madurez !== b.madurez) madurez.push({ id, antes: a.madurez, ahora: b.madurez });
  }
  const flujo = (x: Flujo, y: Flujo) => !igual(x, y);
  const paso = (x: Paso, y: Paso) => !igual(x, y);
  const pasosDe = (m: Mapa) => m.recorridos.flatMap((r) => r.pasos.map((p) => ({ ...p, id: `${r.id}/${p.id}` })));
  return {
    nodos: {
      nuevos: ordenados(nuevos),
      retirados: ordenados(retirados),
      renombrados: renombrados.sort((x, y) => compararCodigo(x.id, y.id)),
      madurez: madurez.sort((x, y) => compararCodigo(x.id, y.id)),
    },
    flujos: colecciones(mapA.flujos, mapB.flujos, flujo),
    pasos: colecciones(pasosDe(mapA), pasosDe(mapB), paso),
  };
}
