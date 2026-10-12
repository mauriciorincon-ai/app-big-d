// El modelo del informe (S6, C20; especificación § 12, RF-06.1, RF-06.4–06.6, RF-05.5, regla dura 10): sobre lo que el núcleo
// ya calculó —la comparación, la simulación, el plan, la hoja de ruta, las alertas de evidencia— arma, en el orden de § 12,
// el esqueleto de las 14 secciones: cifras, ids y enumeraciones, NUNCA un texto. Las palabras las ponen las plantillas
// redactadas en cada idioma (src/lib/informe), así que las dos lenguas llevan las mismas cifras porque salen del mismo
// modelo. Puro, entero y sin reloj ni azar (regla dura 1): la misma entrada da los mismos bytes en Node y en el navegador.
import {
  alertasDeEvidencias,
  type AlertaEvidencia,
  type EvidenciaDeAlerta,
} from "./alertas-evidencias";
import type { HojaDeRuta } from "./hoja-de-ruta";
import type { AlertaDelPlan, ResultadoPlan } from "./plan";
import type { Clase, ResultadoSimulacion } from "./simulacion";
import type { Resultado } from "./tipos";
import type { Umbrales } from "./vigencia";

/** Las 14 secciones de § 12, en su orden. */
export const SECCIONES = [
  "resumen",
  "caso",
  "matriz",
  "pros-contras",
  "robustez",
  "decisiones",
  "implicitas",
  "riesgos",
  "supuestos",
  "relato",
  "hoja-de-ruta",
  "alistamiento",
  "alertas",
  "reproducibilidad",
] as const;
export type SeccionId = (typeof SECCIONES)[number];

/** Cuántas decisiones de una vía y cuántos riesgos destaca el resumen (§ 12.1). */
export const DESTACADOS_RESUMEN = 3;

export type MotivoDeBorrador =
  | { tipo: "perfil-borrador" }
  | { tipo: "plan-borrador" }
  | { tipo: "ciclo" }
  | { tipo: "bloqueado"; ids: string[] };

export interface EntradaInforme {
  perfil_aprobado: boolean;
  plan_aprobado: boolean;
  resultado: Resultado;
  simulacion: ResultadoSimulacion | null;
  plan: ResultadoPlan;
  hoja: HojaDeRuta;
  /** El máximo de la escala de puntaje: con él las unidades se leen en puntos. */
  escala_max: number;
  fecha_evaluacion: string;
  /** Las evidencias aprobadas que el caso podría usar (plataformas que no elimina una restricción). */
  evidencias: readonly EvidenciaDeAlerta[];
  vigencia: Umbrales;
  /** Madurez → ¿disponible de forma general? */
  madurez_disponible: Readonly<Record<string, boolean>>;
  ficha: {
    instantanea: string;
    version_app: string;
    semilla: number;
    semillas_estabilidad: readonly number[];
    aceptadas: number;
    umbrales: {
      empate_centesimas: number;
      robusta_pct: number;
      fragil_pct: number;
      revisar_dias: number;
      vencido_dias: number;
    };
  };
}

export type VeredictoResumen =
  | {
      tipo: "ganadora";
      plataforma_id: string;
      segunda: string | null;
      brecha_unidades: number;
    }
  | { tipo: "empate-tecnico"; plataformas: string[]; brecha_unidades: number }
  | { tipo: "sin-comparacion"; motivo: string };

export interface RobustezResumen {
  clase: Clase | null;
  ganadora: string;
  /** Cuánto de `total_unidades` queda en el primer puesto con los pesos del perfil (semilla principal). */
  primera_unidades: number;
  total_unidades: number;
  aceptadas: number;
}

export interface ResumenInforme {
  veredicto: VeredictoResumen;
  robustez: RobustezResumen | null;
  /** Las decisiones de una vía más críticas (hasta DESTACADOS_RESUMEN): por el riesgo más prioritario que las toca. */
  una_via: string[];
  n_una_via: number;
  /** Los riesgos principales, en el orden de prioridad de acción (hasta DESTACADOS_RESUMEN). */
  riesgos_principales: string[];
  n_altos: number;
  /** Verificaciones de alistamiento (pruebas baratas) todavía pendientes. */
  n_supuestos_por_probar: number;
  escala_max: number;
}

export interface FichaDeReproducibilidad {
  instantanea: string;
  fecha_evaluacion: string;
  version_app: string;
  semilla: number;
  semillas_estabilidad: number[];
  aceptadas: number;
  umbrales: EntradaInforme["ficha"]["umbrales"];
}

export interface ModeloInforme {
  /** `final`, o `borrador` con sus motivos (RF-05.5: un modo de acción obligatoria sin mitigación bloquea el informe final). */
  estado: { tipo: "final" | "borrador"; motivos: MotivoDeBorrador[] };
  secciones: SeccionId[];
  resumen: ResumenInforme;
  alertas: { evidencias: AlertaEvidencia[]; plan: AlertaDelPlan[] };
  ficha: FichaDeReproducibilidad;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function veredictoDe(r: Resultado): VeredictoResumen {
  if (r.tipo === "no-evaluable")
    return {
      tipo: "sin-comparacion",
      motivo: r.motivos[0]?.motivo ?? "no-evaluable",
    };
  const v = r.veredicto;
  if (v.tipo === "empate-tecnico")
    return {
      tipo: "empate-tecnico",
      plataformas: [...v.plataformas].sort(cmp),
      brecha_unidades: v.brecha_unidades,
    };
  const segunda = r.orden.find((p) => p.posicion === 2)?.plataforma_id ?? null;
  return {
    tipo: "ganadora",
    plataforma_id: v.plataforma_id,
    segunda,
    brecha_unidades: v.tipo === "ganadora-clara" ? v.brecha_unidades : 0,
  };
}

function robustezDe(s: ResultadoSimulacion | null): RobustezResumen | null {
  if (!s || !s.ganadora || !s.clase) return null;
  const p0 = s.semillas[0];
  const i = s.plataformas.indexOf(s.ganadora);
  if (!p0 || i < 0) return null;
  return {
    clase: s.clase,
    ganadora: s.ganadora,
    primera_unidades: p0.aceptabilidad[i]![0]!,
    total_unidades: p0.aceptadas * s.L,
    aceptadas: p0.aceptadas,
  };
}

/** Las decisiones de una vía, de la más crítica a la menos: el riesgo más prioritario que las toca, y luego el orden del plan. */
function unaViaCriticas(plan: ResultadoPlan): string[] {
  const posicion = new Map(plan.riesgos.map((r, i) => [r.id, i]));
  return plan.decisiones
    .map((d, orden) => ({
      d,
      orden,
      mejor: Math.min(
        Number.MAX_SAFE_INTEGER,
        ...d.riesgos.map((id) => posicion.get(id) ?? Number.MAX_SAFE_INTEGER),
      ),
    }))
    .filter((x) => x.d.una_via)
    .sort((a, b) => a.mejor - b.mejor || a.orden - b.orden)
    .map((x) => x.d.id);
}

export function modeloInforme(e: EntradaInforme): ModeloInforme {
  const bloqueantes = e.plan.riesgos
    .filter((r) => r.bloqueante)
    .map((r) => r.id);
  const motivos: MotivoDeBorrador[] = [
    ...(e.perfil_aprobado ? [] : [{ tipo: "perfil-borrador" as const }]),
    ...(e.plan_aprobado ? [] : [{ tipo: "plan-borrador" as const }]),
    ...(e.plan.informe.ciclo ? [{ tipo: "ciclo" as const }] : []),
    ...(bloqueantes.length
      ? [{ tipo: "bloqueado" as const, ids: bloqueantes }]
      : []),
  ];
  const una_via = unaViaCriticas(e.plan);
  return {
    estado: { tipo: motivos.length ? "borrador" : "final", motivos },
    secciones: [...SECCIONES],
    resumen: {
      veredicto: veredictoDe(e.resultado),
      robustez: robustezDe(e.simulacion),
      una_via: una_via.slice(0, DESTACADOS_RESUMEN),
      n_una_via: una_via.length,
      riesgos_principales: e.plan.riesgos
        .slice(0, DESTACADOS_RESUMEN)
        .map((r) => r.id),
      n_altos: e.plan.riesgos.filter((r) => r.prioridad_de_accion === "alta")
        .length,
      n_supuestos_por_probar: e.hoja.items.filter(
        (i) =>
          i.tipo === "verificacion_alistamiento" && i.estado === "pendiente",
      ).length,
      escala_max: e.escala_max,
    },
    alertas: {
      evidencias: alertasDeEvidencias(e.evidencias, {
        fecha: e.fecha_evaluacion,
        vigencia: e.vigencia,
        disponible: e.madurez_disponible,
      }),
      plan: e.plan.alertas,
    },
    ficha: {
      instantanea: e.ficha.instantanea,
      fecha_evaluacion: e.fecha_evaluacion,
      version_app: e.ficha.version_app,
      semilla: e.ficha.semilla,
      semillas_estabilidad: [...e.ficha.semillas_estabilidad],
      aceptadas: e.ficha.aceptadas,
      umbrales: { ...e.ficha.umbrales },
    },
  };
}
