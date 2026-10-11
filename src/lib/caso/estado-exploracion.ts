import type { PesoCaso, Sensibilidad } from "@/engine";

// El estado de la exploración de la comparación vive en la URL (D-S3-06 regla 3: el criterio y el peso, nunca el vector):
// `?criterio=crit-x&t=1480`, en centésimas. Sin consulta, el criterio de más peso (a igual peso, el de menor id) en su
// peso del perfil. Una consulta que no cabe (criterio ajeno, peso fuera del rango o fuera de la rejilla) cae al peso del
// perfil de ese criterio, o al estado por omisión: jamás se inventa un estado que la pantalla no puede mostrar.

export interface EstadoExploracion {
  criterio: string;
  t: number;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function exploracionPorOmision(pesos: readonly PesoCaso[]): EstadoExploracion {
  const p = [...pesos].sort((a, b) => b.peso - a.peso || cmp(a.criterio_id, b.criterio_id))[0];
  if (!p) throw new Error("un caso sin criterios no se explora");
  return { criterio: p.criterio_id, t: p.peso };
}

export function estadoExploracion(consulta: string, pesos: readonly PesoCaso[], sensibilidad: readonly Sensibilidad[], paso: number): EstadoExploracion {
  const q = new URLSearchParams(consulta);
  const c = q.get("criterio");
  const p = pesos.find((x) => x.criterio_id === c);
  if (!c || !p) return exploracionPorOmision(pesos);
  const s = sensibilidad.find((x) => x.criterio_id === c);
  const crudo = q.get("t");
  const t = crudo !== null && /^\d{1,5}$/.test(crudo) ? Number(crudo) : -1;
  if (s?.estado === "calculada" && t >= 0 && t <= s.hasta && (t % paso === 0 || t === p.peso)) return { criterio: c, t };
  return { criterio: c, t: p.peso };
}

/** La consulta que guarda un estado (sobre la consulta actual, sin tocar sus otros parámetros); vacía en el de omisión. */
export function consultaExploracion(e: EstadoExploracion, pesos: readonly PesoCaso[], actual: string): string {
  const q = new URLSearchParams(actual);
  const d = exploracionPorOmision(pesos);
  if (e.criterio === d.criterio && e.t === d.t) {
    q.delete("criterio");
    q.delete("t");
  } else {
    q.set("criterio", e.criterio);
    q.set("t", String(e.t));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
