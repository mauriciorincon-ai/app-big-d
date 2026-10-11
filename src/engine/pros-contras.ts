// Pros y contras por reglas (RF-04.8 reescrito por E-15, C14). Se compara cada puntaje contra el ANCLA de la escala y
// contra la MEJOR del conjunto, nunca contra el promedio, que cambiaría al agregar una plataforma (RNF-06). Las anclas
// y el largo de cada lista son convenciones del dato:
//   · se destaca: el puntaje llega al ancla alta (4/4: «nativo y maduro»), o es la única con el mejor puntaje del
//     conjunto y queda por encima del ancla baja;
//   · se queda corta: el puntaje no pasa del ancla baja (2/4: «con limitaciones importantes, o solo en vista previa»).
// Cada lista toma los criterios de más peso (a igual peso, por id) y excluye los de peso cero.

import { cmpTexto } from "./puntaje";
import type { BaseMotor, CasoMotor, Celda, ItemProsContras, ProsContras } from "./tipos";

export function prosContras(celdas: readonly Celda[], plataformas: readonly string[], caso: CasoMotor, base: BaseMotor): ProsContras[] {
  const { ancla_destaca, ancla_corta, max_por_lista } = base.convenciones.pros_contras;
  const pesos = caso.pesos.filter((p) => p.peso > 0).sort((a, b) => b.peso - a.peso || cmpTexto(a.criterio_id, b.criterio_id));
  const deCelda = (p: string, c: string) => celdas.find((x) => x.plataforma_id === p && x.criterio_id === c)!;
  const madurez = (id: string) => base.evidencias.find((e) => e.id === id)!.madurez;
  return plataformas.map((p) => {
    const items: { item: ItemProsContras; destaca: boolean; corta: boolean }[] = pesos.map((w) => {
      const c = deCelda(p, w.criterio_id);
      const otros = plataformas.filter((q) => q !== p).map((q) => deCelda(q, w.criterio_id).puntaje);
      const mejor = Math.max(c.puntaje, ...otros);
      const la_mejor = otros.length > 0 && otros.every((s) => s < c.puntaje);
      return {
        item: { criterio_id: w.criterio_id, peso: w.peso, puntaje: c.puntaje, mejor, la_mejor, esencial: w.esencial, tope_aplicado: c.tope_aplicado, evidencia_id: c.limitante, madurez: madurez(c.limitante) },
        destaca: c.puntaje >= ancla_destaca || (la_mejor && c.puntaje > ancla_corta),
        corta: c.puntaje <= ancla_corta,
      };
    });
    const lista = (cual: "destaca" | "corta") => items.filter((x) => x[cual]).slice(0, max_por_lista).map((x) => x.item);
    return { plataforma_id: p, destaca: lista("destaca"), corta: lista("corta") };
  });
}
