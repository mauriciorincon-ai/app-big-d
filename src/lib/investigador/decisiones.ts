import type { Mapa } from "diagramador";
import type { Afirmacion } from "./esquema";

// Aplicar la decisión humana: cada afirmación rechazada saca del mapa lo que afirmaba. Un componente
// rechazado se lleva sus flujos y todo recorrido que pase por él; un flujo rechazado sale, y con él todo
// recorrido que lo necesitaba (la misma condición de V5: de un paso al siguiente hay un flujo declarado);
// un bloque que queda vacío sale. Lo aprobado queda tal cual lo propuso el investigador. El resultado se
// valida después: si lo que queda rompe una regla del contrato, la aprobación se detiene con la regla.
export function aplicarDecisiones(mapa: Mapa, afirmaciones: readonly Afirmacion[], rechazadas: ReadonlySet<string>): Mapa {
  const fuera = afirmaciones.filter((a) => rechazadas.has(a.id));
  const nodosFuera = new Set(fuera.filter((a) => a.sobre.entidad === "nodo").map((a) => a.sobre.id));
  const flujosFuera = new Set(fuera.filter((a) => a.sobre.entidad === "flujo").map((a) => a.sobre.id));
  const nodos = mapa.nodos.filter((n) => !nodosFuera.has(n.id));
  const flujos = mapa.flujos.filter((f) => !flujosFuera.has(f.id) && !nodosFuera.has(f.origen) && !nodosFuera.has(f.destino));
  const hay = new Set(flujos.map((f) => `${f.origen}>${f.destino}`));
  const recorridos = mapa.recorridos.filter((r) =>
    r.pasos.every((p, k) => {
      if (nodosFuera.has(p.nodo_id)) return false;
      const previo = p.sigue_de !== undefined ? r.pasos.find((x) => x.id === p.sigue_de) : r.pasos[k - 1];
      return !previo || previo.nodo_id === p.nodo_id || hay.has(`${previo.nodo_id}>${p.nodo_id}`);
    }),
  );
  const bloques = mapa.bloques.filter((b) => nodos.some((n) => n.bloque_id === b.id));
  return { ...mapa, nodos, flujos, recorridos, bloques };
}

/** Las afirmaciones que no cubren el mapa: todo componente y todo flujo necesita al menos una. */
export function sinAfirmacion(mapa: Mapa, afirmaciones: readonly Afirmacion[]): string[] {
  const cubre = (entidad: string, id: string) => afirmaciones.some((a) => a.sobre.entidad === entidad && a.sobre.id === id);
  return [...mapa.nodos.filter((n) => !cubre("nodo", n.id)).map((n) => `nodo ${n.id}`), ...mapa.flujos.filter((f) => !cubre("flujo", f.id)).map((f) => `flujo ${f.id}`)];
}
