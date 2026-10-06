// `diff(mapA, mapB)` (§ 4.7): qué cambió entre dos versiones de un mapa. Nodos nuevos (+), retirados (−),
// renombrados (→, por id o por `nombres_anteriores`) y con madurez cambiada (▮); bloques por id, con su nombre
// (0.6.0, F-030: el renombre de un bloque no se veía); flujos y pasos nuevos, retirados o cambiados. Dato puro,
// ordenado por id: la app lo dibuja con glifo + palabra (G7). No compara textos, fuentes ni fechas (§ 4.7).
import type { Bloque, Flujo, Mapa, Nodo, Paso, TextoIdioma } from "./tipos";
import { compararCodigo } from "./util/orden";

export interface Diferencias {
  nodos: {
    nuevos: string[];
    retirados: string[];
    renombrados: { id: string; antes: TextoIdioma; ahora: TextoIdioma; idAnterior?: string }[];
    madurez: { id: string; antes: string; ahora: string }[];
  };
  /** 0.6.0 (F-030): bloques por `id`, con su nombre. */
  bloques: { nuevos: string[]; retirados: string[]; renombrados: { id: string; antes: TextoIdioma; ahora: TextoIdioma }[] };
  flujos: { nuevos: string[]; retirados: string[]; cambiados: string[] };
  pasos: { nuevos: string[]; retirados: string[]; cambiados: string[] };
}

/** JSON con las claves en orden de código: dos objetos iguales con las claves en otro orden dan lo mismo. */
function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  const o = v as Record<string, unknown>;
  const claves = Object.keys(o).filter((k) => o[k] !== undefined).sort(compararCodigo);
  return `{${claves.map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`).join(",")}}`;
}
// M-26 de la auditoría del S1: con `JSON.stringify` a secas, el mismo flujo con sus claves en otro orden salía
// «cambiado» (un YAML reescrito por otra herramienta marcaba los 14 flujos y los 8 pasos).
const igual = (a: unknown, b: unknown): boolean => canonico(a) === canonico(b);
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
  const BA = porId<Bloque>(mapA.bloques);
  const BB = porId<Bloque>(mapB.bloques);
  const bloques: Diferencias["bloques"] = {
    nuevos: ordenados([...BB.keys()].filter((id) => !BA.has(id))),
    retirados: ordenados([...BA.keys()].filter((id) => !BB.has(id))),
    renombrados: [...BB.values()]
      .filter((b) => BA.has(b.id) && !iguales(BA.get(b.id)!.nombre, b.nombre))
      .map((b) => ({ id: b.id, antes: BA.get(b.id)!.nombre, ahora: b.nombre }))
      .sort((x, y) => compararCodigo(x.id, y.id)),
  };
  return {
    nodos: {
      nuevos: ordenados(nuevos),
      retirados: ordenados(retirados),
      renombrados: renombrados.sort((x, y) => compararCodigo(x.id, y.id)),
      madurez: madurez.sort((x, y) => compararCodigo(x.id, y.id)),
    },
    bloques,
    flujos: colecciones(mapA.flujos, mapB.flujos, flujo),
    pasos: colecciones(pasosDe(mapA), pasosDe(mapB), paso),
  };
}
