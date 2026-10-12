import { hojaDeRuta, planDe, type Comparacion, type EntradaRuta, type HojaDeRuta, type ResultadoPlan } from "@/engine";
import type { Caso } from "@/lib/datos/conocimiento";
import type { ConvencionesInforme } from "@/lib/datos/informe";
import type { Decision, Plan } from "@/lib/datos/plan";

// El puente entre el plan que carga la base y el núcleo de la hoja de ruta (S6): el cargador ya comprobó que toda
// capacidad o criterio de una decisión tiene su categoría de alistamiento; aquí solo se resuelve.

/** La categoría de alistamiento (§ 6.11) de la capacidad o del criterio de una decisión. */
export function categoriaDe(d: Decision, categorias: ConvencionesInforme["categorias"]): string {
  const origen = (d.capacidad_id ?? d.criterio_id)!;
  const categoria = categorias[origen];
  if (!categoria) throw new Error(`«${origen}» no tiene categoría de alistamiento: el cargador lo rechaza antes de llegar aquí`);
  return categoria;
}

/** `planDe` sobre el plan de un caso, con la comparación que se le diga. */
export function resultadoDelPlan(plan: Plan, caso: Caso, comparacion: Comparacion): ResultadoPlan {
  return planDe({ decisiones: plan.decisiones, modos_de_falla: plan.modos_de_falla, supuestos: plan.supuestos, fecha_evaluacion: caso.fecha_evaluacion, comparacion });
}

/** La entrada del núcleo de la hoja de ruta: el plan, sus categorías y lo que ya calculó `planDe`. */
export function entradaDeRuta(plan: Plan, categorias: ConvencionesInforme["categorias"], resultado: ResultadoPlan): EntradaRuta {
  return {
    decisiones: plan.decisiones.map((d) => ({ id: d.id, reversibilidad: d.reversibilidad, estado: d.estado, categoria: categoriaDe(d, categorias) })),
    modos_de_falla: plan.modos_de_falla,
    supuestos: plan.supuestos,
    plan: resultado,
  };
}

/** La hoja de ruta del plan de un caso. */
export function hojaDeRutaDe(plan: Plan, categorias: ConvencionesInforme["categorias"], resultado: ResultadoPlan): { entrada: EntradaRuta; hoja: HojaDeRuta } {
  const entrada = entradaDeRuta(plan, categorias, resultado);
  return { entrada, hoja: hojaDeRuta(entrada) };
}
