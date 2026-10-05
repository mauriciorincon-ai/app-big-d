// Contrato de entrada y salida del núcleo comparativo (M4). El núcleo no conoce archivos, idiomas ni Zod: recibe la
// base congelada en una instantánea y el perfil del caso ya validados (src/lib/datos), y devuelve solo enteros,
// textos y listas ordenadas por id, para que el mismo dato dé los mismos bytes en Node y en los tres navegadores.
//
// Unidades. Los pesos van en centésimas (suman 10 000) y los puntajes son enteros de la escala (0 a `max`). El total
// de una plataforma en UNIDADES es U = Σ peso × puntaje; el total en puntos (0 a 100) es U / (100 × max), y una
// centésima de punto vale `max` unidades. Toda comparación se hace en unidades enteras; los decimales son de la
// pantalla.

import type { Racional } from "./racional";
import type { EstadoVigencia } from "./vigencia";

export type EstadoEvidencia = "propuesta" | "aprobada" | "rechazada";

export interface EvidenciaMotor {
  id: string;
  plataforma_id: string;
  /** Exactamente una de las dos: la capacidad (criterio de tipo capacidad) o el criterio transversal. */
  capacidad_id?: string;
  criterio_id?: string;
  puntaje: number;
  madurez: string;
  /** Si cuenta para el mínimo cuando la celda tiene varias evidencias (RF-04.1). */
  esencial: boolean;
  estado: EstadoEvidencia;
  fecha_verificacion: string;
}

export interface CriterioMotor {
  id: string;
  tipo: "capacidad" | "transversal";
  capacidad_id?: string;
}

export interface TopeMadurez {
  madurez: string;
  /** Si la madurez es «disponible de forma general» (de la gramática). */
  disponible: boolean;
  tope: number;
  /** El tope cuando el caso acepta funcionalidades en vista previa (RF-04.2). */
  tope_aceptando_vista_previa: number;
}

export interface ConvencionesMotor {
  /** RF-04.4: la brecha bajo la cual se declara empate técnico, en centésimas de punto (500 = 5 puntos). */
  umbral_empate_centesimas: number;
  vigencia: { revisar_dias: number; vencido_dias: number };
  /** RF-04.8 (E-15): contra el ancla de la escala y la mejor del conjunto, nunca contra el promedio. */
  pros_contras: { ancla_destaca: number; ancla_corta: number; max_por_lista: number };
  /** La rejilla en que la pantalla muestra un evento de la sensibilidad (10 = una décima de punto). */
  sensibilidad: { paso_centesimas: number };
}

/** Lo que el núcleo necesita de la instantánea de conocimiento. */
export interface BaseMotor {
  instantanea: { version: string; huella: string };
  plataformas: { id: string }[];
  criterios: CriterioMotor[];
  evidencias: EvidenciaMotor[];
  escala: { max: number; topes: TopeMadurez[] };
  convenciones: ConvencionesMotor;
}

export interface PesoCaso {
  criterio_id: string;
  /** Centésimas: los del caso suman 10 000. */
  peso: number;
  /** El criterio es esencial PARA ESTE CASO: su puntaje entra al leximin y a la evidencia limitante. */
  esencial: boolean;
  /** Incertidumbre relativa al peso, en por ciento entero (lo usa la simulación). */
  rango_pct: number;
}

export interface CasoMotor {
  id: string;
  estado: "borrador" | "aprobado";
  acepta_vista_previa: boolean;
  fecha_evaluacion: string;
  pesos: PesoCaso[];
  /** RF-03.4: cada restricción eliminatoria nombra las plataformas que no la cumplen. */
  restricciones: { id: string; elimina: string[] }[];
}

export interface Entrada {
  caso: CasoMotor;
  base: BaseMotor;
}

// ── Salida ────────────────────────────────────────────────────────────────────────────────────────────────────

export interface Celda {
  plataforma_id: string;
  criterio_id: string;
  puntaje: number;
  /** Las evidencias que cuentan para el puntaje (la única, o las esenciales si la celda tiene varias). */
  sustento: string[];
  /** La que fija el puntaje: el mínimo, con el tope por madurez ya aplicado. */
  limitante: string;
  /** El tope por madurez bajó el puntaje de la celda. */
  tope_aplicado: boolean;
}

export interface Puesto {
  plataforma_id: string;
  /**
   * 1 + cuántas van antes: por unidades y, a igual total, por leximin. Un empate exacto en los dos comparte el puesto
   * (jamás se rompe por el orden de la lista).
   */
  posicion: number;
  unidades: number;
  /** Puntajes de los criterios esenciales del caso, de menor a mayor: el vector del leximin (C § 1.2). */
  leximin: number[];
}

export interface Limitante {
  plataforma_id: string;
  criterio_id: string;
  evidencia_id: string;
  puntaje: number;
}

export type Veredicto =
  | { tipo: "unica"; plataforma_id: string }
  | { tipo: "ganadora-clara"; plataforma_id: string; brecha_unidades: number }
  | { tipo: "empate-tecnico"; plataformas: string[]; brecha_unidades: number };

export type TipoEvento = "lider" | "puesto-2" | "puesto-3" | "empate-entra" | "empate-sale";

export interface Evento {
  tipo: TipoEvento;
  /** El peso exacto (centésimas) en que ocurre, como racional reducido. */
  t: Racional;
  /** Quiénes ocupan el puesto justo antes y justo después (en el sentido creciente del peso); vacío para el empate. */
  antes: string[];
  despues: string[];
  /** El primer valor de la rejilla, alejándose del peso actual, en que el cambio ya se ve; null si no llega. */
  rejilla: number | null;
}

export type Sensibilidad =
  | { criterio_id: string; estado: "indefinida"; peso: number }
  | { criterio_id: string; estado: "rango-vacio"; peso: number; minimo_que_invierte: Evento | null }
  | {
      criterio_id: string;
      estado: "calculada";
      peso: number;
      /** [0, min(2 × peso, 10 000)] (E-8: acotado a 100 puntos). */
      hasta: number;
      eventos: Evento[];
      inversion_abajo: Evento | null;
      inversion_arriba: Evento | null;
    };

export interface ItemProsContras {
  criterio_id: string;
  peso: number;
  puntaje: number;
  /** El mejor puntaje del conjunto en el criterio. */
  mejor: number;
  /** Única con el mejor puntaje del conjunto. */
  la_mejor: boolean;
  esencial: boolean;
  tope_aplicado: boolean;
  evidencia_id: string;
  madurez: string;
}

export interface ProsContras {
  plataforma_id: string;
  destaca: ItemProsContras[];
  corta: ItemProsContras[];
}

export interface AlertaVigencia {
  plataforma_id: string;
  criterio_id: string;
  evidencia_id: string;
  motivo: Exclude<EstadoVigencia, "vigente"> | "madurez";
  dias: number;
  madurez: string;
}

export type Motivo =
  | { motivo: "perfil-en-borrador" }
  | { motivo: "todas-descartadas" }
  | { motivo: "falta-evidencia"; faltantes: { plataforma_id: string; criterio_id: string }[] };

export interface Descartada {
  plataforma_id: string;
  restricciones: string[];
}

interface Comun {
  caso_id: string;
  instantanea: { version: string; huella: string };
  fecha_evaluacion: string;
  descartadas: Descartada[];
}

export type Resultado =
  | (Comun & { tipo: "no-evaluable"; motivos: Motivo[] })
  | (Comun & {
      tipo: "evaluado";
      evaluadas: string[];
      celdas: Celda[];
      orden: Puesto[];
      veredicto: Veredicto;
      limitantes: Limitante[];
      /** Una por criterio; vacía si solo queda una plataforma (no hay a quién invertir). */
      sensibilidad: Sensibilidad[];
      pros_contras: ProsContras[];
      alertas: AlertaVigencia[];
    });
