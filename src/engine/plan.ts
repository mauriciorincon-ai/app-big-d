// El plan del caso (S5, C16–C18; especificación § 6.8–6.10 y § 11.3): sobre las decisiones, los modos de falla y los
// supuestos que el cargador ya validó, el núcleo calcula lo que la pantalla muestra. Llama al paquete de la casa
// (`instrumentos-de-plan`, contrato v0.2.0: ondas de Kahn con el ciclo mostrado, prioridad de acción por la tabla AIAG-VDA,
// supuestos sin prueba, bloqueantes) y le añade lo que el contrato no trae: el RIESGO RESIDUAL por la MISMA tabla, la
// opción por plataforma que se planifica según el veredicto de la comparación y las alertas. Puro, entero, sin reloj ni
// azar (regla dura 1): la fecha de evaluación es una entrada y las fechas civiles AAAA-MM-DD se comparan como texto.
// Ninguna plataforma tiene trato especial: se ordena por id y el resultado no cambia con el orden de las entradas (regla 5).
import {
  informeDeInstrumentos,
  prioridades,
  type InformeInstrumentos,
  type PrioridadDeAccion,
} from "instrumentos-de-plan";
import type { Resultado } from "./tipos";

export type Reversibilidad = "una_via" | "costosa" | "dos_vias";

export interface OpcionDelPlan {
  plataforma_id: string;
  citas: readonly { evidencia_id: string }[];
  sin_fuente?: boolean;
}
export interface DecisionDelPlan {
  id: string;
  reversibilidad: Reversibilidad;
  depende_de: readonly string[];
  implicita: boolean;
  estado: "pendiente" | "esperando-prueba" | "decidida";
  opciones_por_plataforma: readonly OpcionDelPlan[];
}
export interface ModoDelPlan {
  id: string;
  decision_id: string;
  severidad: number;
  ocurrencia: number;
  deteccion: number;
  control_legal?: boolean;
  mitigaciones: readonly {
    efecto: { ocurrencia?: number; deteccion?: number };
  }[];
}
export interface SupuestoDelPlan {
  id: string;
  criticidad: "alta" | "media" | "baja";
  prueba_barata: { es: string; en: string };
  estado: "sin_probar" | "confirmado" | "refutado";
  vence?: string;
  decisiones: readonly string[];
}

/** Lo que dice la comparación del caso sobre qué plataformas se planifican. */
export type Comparacion =
  | { tipo: "sin-comparacion"; motivo: string }
  | { tipo: "ganadora"; plataformas: readonly string[] }
  | { tipo: "empate-tecnico"; plataformas: readonly string[] };

export interface EntradaPlan {
  decisiones: readonly DecisionDelPlan[];
  modos_de_falla: readonly ModoDelPlan[];
  supuestos: readonly SupuestoDelPlan[];
  /** AAAA-MM-DD: contra ella vence una prueba. Nunca el reloj. */
  fecha_evaluacion: string;
  comparacion: Comparacion;
}

export interface RiesgoResidual {
  ocurrencia: number;
  deteccion: number;
  rpn: number;
  prioridad_de_accion: PrioridadDeAccion;
  prioridad_de_tabla: PrioridadDeAccion;
  /** ¿La tabla da una categoría menor que la de partida? (con `control_legal` la efectiva no baja). */
  baja_de_categoria: boolean;
}
export interface RiesgoCalculado {
  id: string;
  decision_id: string;
  severidad: number;
  ocurrencia: number;
  deteccion: number;
  rpn: number;
  prioridad_de_accion: PrioridadDeAccion;
  prioridad_de_tabla: PrioridadDeAccion;
  control_legal: boolean;
  mitigado: boolean;
  /** Alta efectiva sin mitigación: bloquea la aprobación del plan (G5). */
  bloqueante: boolean;
  /** null si no tiene mitigación: no hay residual que declarar. */
  residual: RiesgoResidual | null;
}
export interface DecisionCalculada {
  id: string;
  /** La onda en que se decide (1 es la primera) o null si el ciclo la deja sin onda. */
  onda: number | null;
  una_via: boolean;
  en_ciclo: boolean;
  /** Plataformas cuya opción se planifica (la ganadora o todas las empatadas); vacía sin comparación. */
  planificadas: string[];
  /** Plataformas de la decisión cuya opción no tiene fuente en la base. */
  supuestos_sin_probar: string[];
  riesgos: string[];
}
export type TipoAlerta =
  | "supuesto-critico-sin-probar"
  | "supuesto-vencido"
  | "supuesto-refutado"
  | "decision-implicita"
  | "opcion-sin-fuente";
export interface AlertaDelPlan {
  tipo: TipoAlerta;
  /** El supuesto o la decisión de la alerta; para una opción sin fuente, `decisión/plataforma`. */
  id: string;
}
export interface ResultadoPlan {
  informe: InformeInstrumentos;
  /** En el orden de decisión: onda a onda, las de una vía primero, luego las que el ciclo deja sin onda. */
  decisiones: DecisionCalculada[];
  /** Prioridad de acción efectiva → severidad → RPN → id (el RPN solo ordena dentro de una prioridad). */
  riesgos: RiesgoCalculado[];
  alertas: AlertaDelPlan[];
  comparacion: Comparacion;
  /** ¿Se puede aprobar? Ni ciclo, ni alta sin mitigación, ni supuesto crítico sin prueba barata. */
  aprobable: boolean;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const ORDEN: Record<PrioridadDeAccion, number> = { alta: 0, media: 1, baja: 2 };

/** La comparación del caso como la necesita el plan: quién gana, quién empata, o que no hay comparación. */
export function comparacionDe(r: Resultado): Comparacion {
  if (r.tipo === "no-evaluable")
    return {
      tipo: "sin-comparacion",
      motivo: r.motivos[0]?.motivo ?? "no-evaluable",
    };
  const v = r.veredicto;
  return v.tipo === "empate-tecnico"
    ? { tipo: "empate-tecnico", plataformas: [...v.plataformas].sort(cmp) }
    : { tipo: "ganadora", plataformas: [v.plataforma_id] };
}

/** La menor de las mejoras que declara una lista de mitigaciones: cada mitigación solo baja, y se acumulan. */
function mejor(base: number, valores: readonly (number | undefined)[]): number {
  return valores.reduce<number>(
    (m, v) => (v !== undefined && v < m ? v : m),
    base,
  );
}

export function planDe(e: EntradaPlan): ResultadoPlan {
  const decisiones = [...e.decisiones].sort((a, b) => cmp(a.id, b.id));
  const modos = [...e.modos_de_falla].sort((a, b) => cmp(a.id, b.id));
  const supuestos = [...e.supuestos].sort((a, b) => cmp(a.id, b.id));
  const informe = informeDeInstrumentos({
    decisiones,
    modos_de_falla: modos.map((m) => ({
      id: m.id,
      severidad: m.severidad,
      ocurrencia: m.ocurrencia,
      deteccion: m.deteccion,
      control_legal: m.control_legal,
      mitigaciones: m.mitigaciones,
    })),
    supuestos,
  });

  const riesgos: RiesgoCalculado[] = modos
    .map((m) => {
      const base = prioridades({
        id: m.id,
        severidad: m.severidad,
        ocurrencia: m.ocurrencia,
        deteccion: m.deteccion,
        control_legal: m.control_legal,
      });
      const mitigado = m.mitigaciones.length > 0;
      let residual: RiesgoResidual | null = null;
      if (mitigado) {
        const ocurrencia = mejor(
          m.ocurrencia,
          m.mitigaciones.map((t) => t.efecto.ocurrencia),
        );
        const deteccion = mejor(
          m.deteccion,
          m.mitigaciones.map((t) => t.efecto.deteccion),
        );
        const p = prioridades({
          id: m.id,
          severidad: m.severidad,
          ocurrencia,
          deteccion,
          control_legal: m.control_legal,
        });
        residual = {
          ocurrencia,
          deteccion,
          rpn: m.severidad * ocurrencia * deteccion,
          ...p,
          baja_de_categoria:
            ORDEN[p.prioridad_de_tabla] > ORDEN[base.prioridad_de_tabla],
        };
      }
      return {
        id: m.id,
        decision_id: m.decision_id,
        severidad: m.severidad,
        ocurrencia: m.ocurrencia,
        deteccion: m.deteccion,
        rpn: m.severidad * m.ocurrencia * m.deteccion,
        prioridad_de_accion: base.prioridad_de_accion,
        prioridad_de_tabla: base.prioridad_de_tabla,
        control_legal: base.control_legal,
        mitigado,
        bloqueante: base.prioridad_de_accion === "alta" && !mitigado,
        residual,
      };
    })
    .sort(
      (a, b) =>
        ORDEN[a.prioridad_de_accion] - ORDEN[b.prioridad_de_accion] ||
        b.severidad - a.severidad ||
        b.rpn - a.rpn ||
        cmp(a.id, b.id),
    );

  const planificadas =
    e.comparacion.tipo === "sin-comparacion"
      ? []
      : [...e.comparacion.plataformas].sort(cmp);
  const ondaDe = new Map(
    informe.ondas.flatMap((ids, i) => ids.map((id) => [id, i + 1] as const)),
  );
  const enCiclo = new Set(informe.ciclo ?? []);
  // Lo que el ciclo deja sin onda va al final, con los miembros del ciclo juntos y en el orden de su camino (así sus flechas
  // quedan entre tarjetas contiguas), y después el resto por id.
  const sinOnda = decisiones.map((d) => d.id).filter((id) => !ondaDe.has(id));
  const delCiclo = [...new Set(informe.ciclo ?? [])].filter((id) => sinOnda.includes(id));
  const orden = [...informe.ondas.flat(), ...delCiclo, ...sinOnda.filter((id) => !delCiclo.includes(id))];
  const porId = new Map(decisiones.map((d) => [d.id, d]));
  const calculadas: DecisionCalculada[] = orden.map((id) => {
    const d = porId.get(id)!;
    return {
      id,
      onda: ondaDe.get(id) ?? null,
      una_via: d.reversibilidad === "una_via",
      en_ciclo: enCiclo.has(id),
      planificadas: d.opciones_por_plataforma
        .map((o) => o.plataforma_id)
        .filter((p) => planificadas.includes(p))
        .sort(cmp),
      supuestos_sin_probar: supuestos
        .filter((s) => s.estado === "sin_probar" && s.decisiones.includes(id))
        .map((s) => s.id),
      riesgos: riesgos.filter((r) => r.decision_id === id).map((r) => r.id),
    };
  });

  const alertas: AlertaDelPlan[] = [
    ...supuestos
      .filter((s) => s.estado === "sin_probar" && s.criticidad === "alta")
      .map((s) => ({
        tipo: "supuesto-critico-sin-probar" as const,
        id: s.id,
      })),
    ...supuestos
      .filter(
        (s) =>
          s.estado === "sin_probar" &&
          s.vence !== undefined &&
          s.vence < e.fecha_evaluacion,
      )
      .map((s) => ({
        tipo: "supuesto-vencido" as const,
        id: s.id,
      })),
    ...supuestos
      .filter((s) => s.estado === "refutado")
      .map((s) => ({
        tipo: "supuesto-refutado" as const,
        id: s.id,
      })),
    ...decisiones
      .filter((d) => d.implicita && d.estado !== "decidida")
      .map((d) => ({
        tipo: "decision-implicita" as const,
        id: d.id,
      })),
    ...decisiones.flatMap((d) =>
      d.opciones_por_plataforma
        .filter((o) => o.sin_fuente === true)
        .map((o) => ({
          tipo: "opcion-sin-fuente" as const,
          id: `${d.id}/${o.plataforma_id}`,
        })),
    ),
  ];

  return {
    informe,
    decisiones: calculadas,
    riesgos,
    alertas,
    comparacion:
      e.comparacion.tipo === "sin-comparacion"
        ? e.comparacion
        : { tipo: e.comparacion.tipo, plataformas: planificadas },
    aprobable: informe.ok,
  };
}
