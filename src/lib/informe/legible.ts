import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import { detectarJerga, palabrasDe } from "@/engine";
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
      if (!lectura.cumple) {
        // Dice cuál de los dos límites se rompió: el largo (palabras Y sílabas pasadas) o los términos a explicar.
        const roto = [
          !lectura.por_palabras && !lectura.por_silabas ? "pasa de las dos medidas de largo" : null,
          !lectura.terminos_ok ? "trae más términos a explicar de los que caben" : null,
        ].filter(Boolean);
        fallas.push(`${donde} · ${lectura.palabras} palabras, ${lectura.silabas} sílabas y ${lectura.terminos.length} términos a explicar (${roto.join(" y ")}): el presupuesto es de ${palabras_max} palabras o ${silabas_max} sílabas y ${terminos_max} término(s)`);
      }
      if (sinExplicar.length) fallas.push(`${donde} · términos a explicar sin entrada en el glosario de data/convenciones/informe.yaml: ${sinExplicar.join(", ")}`);
    }
  }
  return fallas;
}

// S9 (regla dura 11, decisions/jargon-detector.md): el detector de jerga sobre el mismo párrafo de § 1, en cada idioma. Una
// palabra rara (fuera de la tabla derivada de Google Books Ngram, CC BY 3.0), que no es una permitida del dato ni un término que el
// glosario del informe explica, deja la base sin publicar: se reescribe el texto o una persona la agrega a `permitidas`.
export function resumenesConJerga(k: Conocimiento): string[] {
  const fallas: string[] = [];
  for (const caso of k.casos) {
    const plan = k.planes.find((p) => p.caso_id === caso.id);
    if (!plan) continue;
    const informe = construirInforme(k, caso, plan);
    for (const idioma of IDIOMAS) {
      const { texto } = lecturaDelResumen(k, informe, plan, idioma);
      const tabla = { largo_minimo: k.jerga.largo_minimo, umbral_cubo: k.jerga.umbral_cubo, cubos: k.jerga.cubos[idioma] };
      const explicadas = k.informe.glosario.flatMap((g) => g.formas[idioma]);
      // Los nombres de las plataformas de la base son nombres propios: se citan tal cual, no son jerga.
      const nombres = k.plataformas.flatMap((p) => palabrasDe(p.nombre[idioma]));
      const raras = detectarJerga(texto, tabla, [...k.jerga.permitidas[idioma], ...nombres], explicadas);
      if (raras.length) fallas.push(`data/casos/${caso.id} · ${caso.id} · informe.resumen.${idioma} · palabras fuera del vocabulario llano de data/convenciones/jerga.yaml: ${raras.join(", ")}`);
    }
  }
  return fallas;
}
