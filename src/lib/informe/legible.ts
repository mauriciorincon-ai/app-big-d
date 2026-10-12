import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import { IDIOMAS } from "@/lib/i18n";
import { construirInforme } from "./construir";
import { lecturaDelResumen } from "./narrativa";

// El gate de lectura del informe (S6, E-13, regla dura 11, RF-09.4): el párrafo de § 1 de cada caso con plan, en cada
// idioma, cumple el presupuesto del dato (palabras O sílabas, y a lo sumo N términos a explicar) y todo término que
// contiene está explicado en el glosario. Si no, la base no se publica: «lo que no pasa el gate no se publica».
// Devuelve una falla por cada incumplimiento, con el formato de la base.
export function resumenesIlegibles(k: Conocimiento): string[] {
  const fallas: string[] = [];
  const { palabras_max, silabas_max, terminos_max } = k.informe.lectura;
  for (const caso of k.casos) {
    const plan = k.planes.find((p) => p.caso_id === caso.id);
    if (!plan) continue;
    const informe = construirInforme(k, caso, plan);
    for (const idioma of IDIOMAS) {
      const { lectura, sinExplicar } = lecturaDelResumen(k, informe, plan, idioma);
      const donde = `data/casos/${caso.id} · ${caso.id} · informe.resumen.${idioma}`;
      if (!lectura.cumple)
        fallas.push(`${donde} · ${lectura.palabras} palabras, ${lectura.silabas} sílabas y ${lectura.terminos.length} términos a explicar: el presupuesto es de ${palabras_max} palabras o ${silabas_max} sílabas y ${terminos_max} término(s)`);
      if (sinExplicar.length) fallas.push(`${donde} · términos a explicar sin entrada en el glosario de data/convenciones/informe.yaml: ${sinExplicar.join(", ")}`);
    }
  }
  return fallas;
}
