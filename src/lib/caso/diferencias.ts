// D2 (S8): lo que cambió entre cada instantánea y la anterior, para la página de la base (en el build). Las evidencias,
// por id y con los campos que cambiaron (el núcleo: `diferenciasEvidencias`); y cada caso evaluado con una y con otra
// (`impactoEnCaso`), sin importar qué instantánea cita: la pregunta es «si el caso se evaluara con esta, ¿qué cambia?».
import { diferenciasEvidencias, evaluar, impactoEnCaso, type DiferenciaEvidencias, type ImpactoEnCaso } from "@/engine";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import { entradaDe } from "@/lib/datos/instantanea";

export interface ParDeInstantaneas {
  antes: string;
  ahora: string;
  evidencias: DiferenciaEvidencias;
  casos: ({ caso_id: string } & ImpactoEnCaso)[];
}

/** Cada instantánea frente a la que la precede, de la más nueva a la más vieja; vacía con una sola. */
export function diferenciasDeLaBase(k: Pick<Conocimiento, "instantaneas" | "casos">): ParDeInstantaneas[] {
  const out: ParDeInstantaneas[] = [];
  for (let i = k.instantaneas.length - 1; i >= 1; i--) {
    const a = k.instantaneas[i - 1]!;
    const b = k.instantaneas[i]!;
    out.push({
      antes: a.version,
      ahora: b.version,
      evidencias: diferenciasEvidencias(a.contenido.evidencias, b.contenido.evidencias),
      casos: [...k.casos]
        .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
        .map((caso) => ({ caso_id: caso.id, ...impactoEnCaso(evaluar(entradaDe(caso, a)), evaluar(entradaDe(caso, b))) })),
    });
  }
  return out;
}
