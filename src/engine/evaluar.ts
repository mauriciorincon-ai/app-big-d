// El núcleo comparativo de punta a punta (M4): descarta por restricciones, puntúa cada celda, suma, ordena, declara
// ganadora o empate técnico y calcula la sensibilidad, los pros y contras y las alertas. Puro: misma entrada, mismos
// bytes. No evalúa un perfil en borrador (RF-03.5) ni una base a la que le falta una evidencia aprobada (RF-02.3): en
// esos casos dice por qué, con qué falta, y no calcula nada.

import { alertasDe } from "./alertas";
import { prosContras } from "./pros-contras";
import { celda, cmpTexto, descartes, limitantes, ordenar, porId, unidades, vectorLeximin, veredicto } from "./puntaje";
import { sensibilidadDe, TOTAL } from "./sensibilidad";
import type { Celda, Entrada, Motivo, Resultado } from "./tipos";

const entero = (x: number, que: string, min: number, max: number) => {
  if (!Number.isSafeInteger(x) || x < min || x > max) throw new Error(`núcleo: ${que} debe ser un entero entre ${min} y ${max} (es ${x})`);
};

/** Las precondiciones que el cargador ya garantiza; si algo llega roto, el núcleo lanza en vez de calcular. */
function validarEntrada({ caso, base }: Entrada): void {
  entero(base.escala.max, "el máximo de la escala", 1, 100);
  const criterios = base.criterios.map((c) => c.id).sort(cmpTexto);
  const delCaso = caso.pesos.map((p) => p.criterio_id).sort(cmpTexto);
  if (criterios.join("|") !== delCaso.join("|")) throw new Error(`núcleo: el caso pesa [${delCaso.join(", ")}] y la base trae [${criterios.join(", ")}]`);
  for (const p of caso.pesos) {
    entero(p.peso, `el peso de ${p.criterio_id}`, 0, TOTAL);
    entero(p.rango_pct, `el rango de ${p.criterio_id}`, 0, 100);
  }
  const suma = caso.pesos.reduce((s, p) => s + p.peso, 0);
  if (suma !== TOTAL) throw new Error(`núcleo: los pesos suman ${suma} y deben sumar ${TOTAL}`);
  const ids = new Set(base.plataformas.map((p) => p.id));
  for (const r of caso.restricciones) for (const id of r.elimina) if (!ids.has(id)) throw new Error(`núcleo: la restricción ${r.id} elimina a «${id}», que no está en la base`);
  for (const e of base.evidencias) entero(e.puntaje, `el puntaje de ${e.id}`, 0, base.escala.max);
  const c = base.convenciones;
  entero(c.umbral_empate_centesimas, "el umbral del empate", 0, TOTAL);
  entero(c.sensibilidad.paso_centesimas, "el paso de la rejilla", 1, TOTAL);
}

export function evaluar(entrada: Entrada): Resultado {
  validarEntrada(entrada);
  const { caso, base } = entrada;
  const descartadas = descartes(caso, base);
  const comun = { caso_id: caso.id, instantanea: base.instantanea, fecha_evaluacion: caso.fecha_evaluacion, descartadas };
  const fuera = new Set(descartadas.map((d) => d.plataforma_id));
  const evaluadas = base.plataformas.map((p) => p.id).filter((id) => !fuera.has(id)).sort(cmpTexto);
  const criterios = [...base.criterios].sort(porId);

  const motivos: Motivo[] = [];
  if (caso.estado !== "aprobado") motivos.push({ motivo: "perfil-en-borrador" });
  if (!evaluadas.length) motivos.push({ motivo: "todas-descartadas" });
  const celdas: Celda[] = [];
  const faltantes: { plataforma_id: string; criterio_id: string }[] = [];
  for (const p of evaluadas)
    for (const c of criterios) {
      const x = celda(p, c, base, caso.acepta_vista_previa);
      if (x) celdas.push(x);
      else faltantes.push({ plataforma_id: p, criterio_id: c.id });
    }
  if (faltantes.length) motivos.push({ motivo: "falta-evidencia", faltantes });
  if (motivos.length) return { ...comun, tipo: "no-evaluable", motivos };

  const pesoDe = new Map(caso.pesos.map((p) => [p.criterio_id, p.peso]));
  const orden = ordenar(evaluadas.map((p) => ({ plataforma_id: p, unidades: unidades(celdas, p, pesoDe), leximin: vectorLeximin(celdas, p, caso) })));
  // El umbral del dato está en centésimas de punto; una centésima de punto vale `max` unidades.
  const banda = base.convenciones.umbral_empate_centesimas * base.escala.max;
  return {
    ...comun,
    tipo: "evaluado",
    evaluadas,
    celdas,
    orden,
    veredicto: veredicto(orden, banda),
    limitantes: limitantes(celdas, evaluadas, caso),
    sensibilidad: evaluadas.length >= 2 ? sensibilidadDe(celdas, evaluadas, caso, banda, base.convenciones.sensibilidad.paso_centesimas) : [],
    pros_contras: prosContras(celdas, evaluadas, caso, base),
    alertas: alertasDe(celdas, base, caso.fecha_evaluacion),
  };
}
