// CSS generado del recorrido (§ 4.3, G12): el controlador de la app solo cambia `data-paso` del
// contenedor; estas reglas deciden qué nodo es activo, visitado o pendiente y qué flujo se resalta. El SVG
// no cambia entre pasos y el árbol del DOM no depende de la preferencia de movimiento.
import type { Geometria } from "../layout/tipos";

const noEs = (atributo: string, ids: readonly string[], op = "~="): string => ids.map((id) => `:not([${atributo}${op}"${id}"])`).join("");

/** `contenedor`: selector del elemento que lleva `data-paso` («todos» o el id de un paso). */
export function toJourneyCSS(geo: Geometria, contenedor: string): string {
  const r = geo.recorrido;
  if (!r) throw new Error("toJourneyCSS: la geometría no es de la vista «recorrido»");
  const C = (paso: string) => `${contenedor}[data-paso="${paso}"]`;
  const flujosDe = (ids: readonly string[]) => r.pasos.filter((p) => ids.includes(p.id) && p.flujo).map((p) => p.flujo!);
  const lineas: string[] = [];
  for (const p of r.pasos) {
    const camino = [p.id, ...p.visitados];
    const flujos = flujosDe(camino);
    lineas.push(`${C(p.id)} .dg-nodo[data-paso~="${p.id}"] [data-caja] { stroke: var(--tinta-1); stroke-width: 3; }`);
    lineas.push(`${C(p.id)} .dg-nodo[data-paso~="${p.id}"] .dg-paso-insignia rect { stroke-width: 4; }`);
    lineas.push(`${C(p.id)} .dg-nodo${noEs("data-paso", camino)} { opacity: 0.35; }`);
    lineas.push(`${C(p.id)} :is(.dg-flujo, .dg-ref)${flujos.length ? noEs("data-flujo", flujos, "=") : ""} { opacity: 0.2; }`);
    if (p.flujo) {
      lineas.push(`${C(p.id)} .dg-flujo[data-flujo="${p.flujo}"] .dg-linea { stroke: var(--tinta-1); stroke-width: 3; }`);
      lineas.push(`${C(p.id)} .dg-flujo[data-flujo="${p.flujo}"] .dg-punta { fill: var(--tinta-1); }`);
    }
  }
  const todos = r.pasos.filter((p) => p.flujo).map((p) => p.flujo!);
  lineas.push(`${C("todos")} .dg-nodo:not([data-paso]) { opacity: 0.35; }`);
  lineas.push(`${C("todos")} :is(.dg-flujo, .dg-ref)${noEs("data-flujo", todos, "=")} { opacity: 0.2; }`);
  return `${lineas.join("\n")}\n`;
}
