import { diff, type Mapa } from "diagramador";
import type { Retiro } from "./esquema";

// Retiros: lo que el mapa aprobado tiene y la propuesta ya no trae. No son afirmaciones (M-21), pero ninguno sale
// sin su argumento (pedido de la persona al mirar la lista, 2026-09-30: «que no queden dudas de por qué sale»):
//   - un flujo que pierde uno de sus extremos sale POR ARRASTRE: ese argumento lo da el código;
//   - todo lo demás (un componente, o un flujo cuyos dos extremos siguen) trae un retiro de la propuesta con su
//     motivo y una cita de la documentación del fabricante, que se verifica como la de una afirmación.

export type Argumento = { tipo: "arrastre"; por: string[] } | { tipo: "cita"; retiro: Retiro };

/** Los componentes y flujos del aprobado que la propuesta ya no trae (un renombre no es un retiro). */
export function retirosDe(anterior: Mapa | undefined, propuesto: Mapa): string[] {
  if (!anterior) return [];
  const d = diff(anterior, propuesto);
  return [...d.nodos.retirados, ...d.flujos.retirados].sort();
}

/** El argumento de cada retiro, y una falla por cada retiro sin argumento o por cada retiro propuesto que sobra. */
export function argumentosDeRetiro(anterior: Mapa | undefined, propuesto: Mapa, retiros: readonly Retiro[]): { argumentos: Map<string, Argumento>; fallas: string[] } {
  const salen = new Set(retirosDe(anterior, propuesto));
  const nodosQueSalen = new Set(anterior?.nodos.filter((n) => salen.has(n.id)).map((n) => n.id) ?? []);
  const argumentos = new Map<string, Argumento>();
  const fallas: string[] = [];
  const ids = new Set<string>();
  /** Lo que ya tiene un retiro propuesto, aunque falle por otra razón: esa falla basta, no se repite como «sin argumento». */
  const conRetiro = new Set<string>();
  for (const r of retiros) {
    if (ids.has(r.id)) {
      fallas.push(`retiros · ${r.id} repetido`);
      continue;
    }
    ids.add(r.id);
    const sale = r.sobre.entidad === "nodo" ? nodosQueSalen.has(r.sobre.id) : salen.has(r.sobre.id) && !nodosQueSalen.has(r.sobre.id);
    if (!sale) {
      fallas.push(`retiros · ${r.id} habla de un ${r.sobre.entidad} que no sale del mapa aprobado («${r.sobre.id}»)`);
      continue;
    }
    if (conRetiro.has(r.sobre.id)) fallas.push(`retiros · ${r.id}: «${r.sobre.id}» ya tiene su retiro`);
    else if (r.cita.tipo !== "oficial") fallas.push(`retiros · ${r.id} cita una fuente de tercero: un retiro se prueba con la documentación del fabricante`);
    else argumentos.set(r.sobre.id, { tipo: "cita", retiro: r });
    conRetiro.add(r.sobre.id);
  }
  for (const id of [...salen].sort()) {
    if (conRetiro.has(id)) continue;
    const flujo = nodosQueSalen.has(id) ? undefined : anterior!.flujos.find((f) => f.id === id);
    const por = flujo ? [...new Set([flujo.origen, flujo.destino])].filter((x) => nodosQueSalen.has(x)) : [];
    if (por.length) argumentos.set(id, { tipo: "arrastre", por });
    else fallas.push(`retiros · ${flujo ? "el flujo" : "el componente"} «${id}» sale del mapa sin argumento: agrega un retiro con su motivo y una cita que lo pruebe, o devuélvelo al mapa`);
  }
  return { argumentos, fallas };
}
