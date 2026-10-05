// Casos de referencia del instrumento (RF-09.1): entradas pequeñas cuya respuesta correcta es evidente a simple vista,
// con el resultado esperado escrito al lado. Las pruebas los corren y la pantalla del instrumento los lista; si el
// núcleo deja de dar lo esperado, la validación falla y no se publica (RF-09.4). Sus convenciones son las del método
// (empate a 5 puntos, anclas 4 y 2) y sus plataformas son ficticias: nada aquí describe un producto real.

import { canonicoEstricto } from "./canonico";
import { evaluar } from "./evaluar";
import type { BaseMotor, CasoMotor, EvidenciaMotor, Resultado, TopeMadurez } from "./tipos";

const TOPES: TopeMadurez[] = [
  { madurez: "disponible-general", disponible: true, tope: 4, tope_aceptando_vista_previa: 4 },
  { madurez: "vista-previa-publica", disponible: false, tope: 2, tope_aceptando_vista_previa: 4 },
];

type Fila = [plataforma: string, criterio: string, puntaje: number, extra?: Partial<EvidenciaMotor>];

/** Una base de criterios transversales con una evidencia aprobada por fila. */
function base(plataformas: string[], criterios: string[], filas: Fila[]): BaseMotor {
  return {
    instantanea: { version: "referencia", huella: "0".repeat(64) },
    plataformas: plataformas.map((id) => ({ id })),
    criterios: criterios.map((id) => ({ id, tipo: "transversal" as const })),
    evidencias: filas.map(([p, c, s, extra], i) => ({
      id: `evi-${p}-${c}-${i + 1}`,
      plataforma_id: p,
      criterio_id: c,
      puntaje: s,
      madurez: "disponible-general",
      esencial: true,
      estado: "aprobada" as const,
      fecha_verificacion: "2026-10-01",
      ...extra,
    })),
    escala: { max: 4, topes: TOPES },
    convenciones: {
      umbral_empate_centesimas: 500,
      vigencia: { revisar_dias: 30, vencido_dias: 60 },
      pros_contras: { ancla_destaca: 4, ancla_corta: 2, max_por_lista: 3 },
      sensibilidad: { paso_centesimas: 10 },
    },
  };
}

function caso(pesos: [criterio: string, peso: number][], extra: Partial<CasoMotor> = {}): CasoMotor {
  return {
    id: "referencia",
    estado: "aprobado",
    acepta_vista_previa: false,
    fecha_evaluacion: "2026-10-04",
    pesos: pesos.map(([criterio_id, peso]) => ({ criterio_id, peso, esencial: false, rango_pct: 20 })),
    restricciones: [],
    ...extra,
  };
}

/** Lo que se compara de un resultado: su tipo, su veredicto y por qué no se evaluó. */
export interface Resumen {
  tipo: Resultado["tipo"];
  veredicto?: { tipo: string; plataformas: string[] };
  motivos?: string[];
  /** Puntaje de una celda que el caso vigila. */
  celda?: { plataforma_id: string; criterio_id: string; puntaje: number };
}

export function resumen(r: Resultado, celda?: { plataforma_id: string; criterio_id: string }): Resumen {
  if (r.tipo === "no-evaluable") return { tipo: r.tipo, motivos: r.motivos.map((m) => m.motivo) };
  const v = r.veredicto;
  const out: Resumen = { tipo: r.tipo, veredicto: { tipo: v.tipo, plataformas: v.tipo === "empate-tecnico" ? v.plataformas : [v.plataforma_id] } };
  if (celda) {
    const c = r.celdas.find((x) => x.plataforma_id === celda.plataforma_id && x.criterio_id === celda.criterio_id)!;
    out.celda = { ...celda, puntaje: c.puntaje };
  }
  return out;
}

export interface CasoDeReferencia {
  id: string;
  descripcion: { es: string; en: string };
  entrada: { caso: CasoMotor; base: BaseMotor };
  vigila?: { plataforma_id: string; criterio_id: string };
  esperado: Resumen;
}

const P3 = ["ref-a", "ref-b", "ref-c"];
const K3 = ["crit-k1", "crit-k2", "crit-k3"];

export const CASOS_DE_REFERENCIA: CasoDeReferencia[] = [
  {
    id: "todo-el-peso",
    descripcion: {
      es: "Todo el peso en un criterio donde una sola plataforma tiene el máximo: gana ella, con ventaja clara.",
      en: "All the weight on a criterion where a single platform has the maximum: it wins, by a clear margin.",
    },
    entrada: {
      caso: caso([["crit-k1", 10_000], ["crit-k2", 0], ["crit-k3", 0]]),
      base: base(P3, K3, [["ref-a", "crit-k1", 3], ["ref-a", "crit-k2", 4], ["ref-a", "crit-k3", 4], ["ref-b", "crit-k1", 4], ["ref-b", "crit-k2", 0], ["ref-b", "crit-k3", 0], ["ref-c", "crit-k1", 3], ["ref-c", "crit-k2", 4], ["ref-c", "crit-k3", 4]]),
    },
    esperado: { tipo: "evaluado", veredicto: { tipo: "ganadora-clara", plataformas: ["ref-b"] } },
  },
  {
    id: "empate-exacto",
    descripcion: {
      es: "Dos plataformas con los mismos puntajes: empate técnico declarado y el puesto compartido, nunca por el orden de la lista.",
      en: "Two platforms with the same scores: a declared technical tie and a shared place, never by list order.",
    },
    entrada: {
      caso: caso([["crit-k1", 6_000], ["crit-k2", 4_000]], { pesos: [{ criterio_id: "crit-k1", peso: 6_000, esencial: true, rango_pct: 20 }, { criterio_id: "crit-k2", peso: 4_000, esencial: false, rango_pct: 20 }] }),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 3], ["ref-a", "crit-k2", 2], ["ref-b", "crit-k1", 3], ["ref-b", "crit-k2", 2]]),
    },
    esperado: { tipo: "evaluado", veredicto: { tipo: "empate-tecnico", plataformas: ["ref-a", "ref-b"] } },
  },
  {
    id: "todas-descartadas",
    descripcion: {
      es: "Una restricción eliminatoria que ninguna plataforma cumple: no hay comparación, y se dice por qué.",
      en: "An eliminating constraint no platform meets: there is no comparison, and the reason is stated.",
    },
    entrada: {
      caso: caso([["crit-k1", 5_000], ["crit-k2", 5_000]], { restricciones: [{ id: "res-todas", elimina: ["ref-a", "ref-b"] }] }),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 3], ["ref-a", "crit-k2", 2], ["ref-b", "crit-k1", 4], ["ref-b", "crit-k2", 1]]),
    },
    esperado: { tipo: "no-evaluable", motivos: ["todas-descartadas"] },
  },
  {
    id: "tope-sin-vista-previa",
    descripcion: {
      es: "Un 4 en vista previa vale 2 si el caso no acepta vista previa: la otra plataforma gana.",
      en: "A 4 in preview counts as 2 when the case does not accept previews: the other platform wins.",
    },
    entrada: {
      caso: caso([["crit-k1", 8_000], ["crit-k2", 2_000]]),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 4, { madurez: "vista-previa-publica" }], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 3], ["ref-b", "crit-k2", 3]]),
    },
    vigila: { plataforma_id: "ref-a", criterio_id: "crit-k1" },
    esperado: { tipo: "evaluado", veredicto: { tipo: "ganadora-clara", plataformas: ["ref-b"] }, celda: { plataforma_id: "ref-a", criterio_id: "crit-k1", puntaje: 2 } },
  },
  {
    id: "tope-con-vista-previa",
    descripcion: {
      es: "La misma base con un caso que acepta vista previa: el 4 cuenta entero y la ganadora cambia.",
      en: "The same base with a case that accepts previews: the 4 counts in full and the winner changes.",
    },
    entrada: {
      caso: caso([["crit-k1", 8_000], ["crit-k2", 2_000]], { acepta_vista_previa: true }),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 4, { madurez: "vista-previa-publica" }], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 3], ["ref-b", "crit-k2", 3]]),
    },
    vigila: { plataforma_id: "ref-a", criterio_id: "crit-k1" },
    esperado: { tipo: "evaluado", veredicto: { tipo: "ganadora-clara", plataformas: ["ref-a"] }, celda: { plataforma_id: "ref-a", criterio_id: "crit-k1", puntaje: 4 } },
  },
  {
    id: "minimo-de-esenciales",
    descripcion: {
      es: "Una celda con una evidencia esencial de 1 y una accesoria de 4: cuenta el mínimo de las esenciales, 1.",
      en: "A cell with an essential piece of evidence at 1 and an accessory one at 4: the minimum of the essential ones counts, 1.",
    },
    entrada: {
      caso: caso([["crit-k1", 5_000], ["crit-k2", 5_000]]),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 1], ["ref-a", "crit-k1", 4, { esencial: false }], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 3], ["ref-b", "crit-k2", 3]]),
    },
    vigila: { plataforma_id: "ref-a", criterio_id: "crit-k1" },
    esperado: { tipo: "evaluado", veredicto: { tipo: "ganadora-clara", plataformas: ["ref-b"] }, celda: { plataforma_id: "ref-a", criterio_id: "crit-k1", puntaje: 1 } },
  },
  {
    id: "propuesta-no-cuenta",
    descripcion: {
      es: "Una evidencia propuesta de 4 junto a una aprobada de 1: solo la aprobada participa.",
      en: "A proposed piece of evidence at 4 next to an approved one at 1: only the approved one takes part.",
    },
    entrada: {
      caso: caso([["crit-k1", 5_000], ["crit-k2", 5_000]]),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 1], ["ref-a", "crit-k1", 4, { estado: "propuesta" }], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 3], ["ref-b", "crit-k2", 3]]),
    },
    vigila: { plataforma_id: "ref-a", criterio_id: "crit-k1" },
    esperado: { tipo: "evaluado", veredicto: { tipo: "ganadora-clara", plataformas: ["ref-b"] }, celda: { plataforma_id: "ref-a", criterio_id: "crit-k1", puntaje: 1 } },
  },
  {
    id: "falta-evidencia",
    descripcion: {
      es: "Una plataforma sin evidencia aprobada en un criterio: la evaluación se bloquea y dice cuál falta.",
      en: "A platform without approved evidence on one criterion: the evaluation is blocked and says which one is missing.",
    },
    entrada: {
      caso: caso([["crit-k1", 5_000], ["crit-k2", 5_000]]),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 3], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 3]]),
    },
    esperado: { tipo: "no-evaluable", motivos: ["falta-evidencia"] },
  },
  {
    id: "perfil-en-borrador",
    descripcion: {
      es: "Un perfil en borrador no se evalúa, aunque la base esté completa.",
      en: "A draft profile is not evaluated, even with a complete base.",
    },
    entrada: {
      caso: caso([["crit-k1", 5_000], ["crit-k2", 5_000]], { estado: "borrador" }),
      base: base(["ref-a", "ref-b"], ["crit-k1", "crit-k2"], [["ref-a", "crit-k1", 3], ["ref-a", "crit-k2", 3], ["ref-b", "crit-k1", 4], ["ref-b", "crit-k2", 4]]),
    },
    esperado: { tipo: "no-evaluable", motivos: ["perfil-en-borrador"] },
  },
];

/** Corre un caso de referencia y dice si dio lo esperado. */
export function correrReferencia(c: CasoDeReferencia): { obtenido: Resumen; ok: boolean } {
  const obtenido = resumen(evaluar(c.entrada), c.vigila);
  return { obtenido, ok: canonicoEstricto(obtenido) === canonicoEstricto(c.esperado) };
}
