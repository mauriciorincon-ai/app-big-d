// La consulta de la URL como almacén externo de React (useSyncExternalStore): la exploración de pesos (S3) y la
// comparación de pares (S8) leen y escriben aquí. Escribir avisa a todos los que leen; `history.replaceState` no deja
// rastro en el historial. El servidor (export estático) ve la consulta vacía: el primer pintado es el del dato.
const oyentes = new Set<() => void>();

export function suscribirConsulta(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("popstate", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("popstate", avisar);
  };
}

export function escribirConsulta(consulta: string) {
  if (consulta === window.location.search) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${consulta}${window.location.hash}`);
  for (const avisar of oyentes) avisar();
}

export const consultaDelCliente = () => window.location.search;
export const consultaDelServidor = () => "";
