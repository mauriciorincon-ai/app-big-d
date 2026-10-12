// Las alertas de evidencia del informe (S6, sección 13, E-23, regla dura 6): sobre las evidencias APROBADAS que el caso
// podría usar —no solo las que sostienen un puntaje—, cuáles están vencidas, por revisar, en vista previa o sin fuente
// primaria oficial. Con el perfil en borrador la comparación no puntúa, pero las alertas de la base se dicen igual: es lo
// que el comité tiene que saber antes de confiar en nada. Puro, entero y sin reloj: la fecha de evaluación es una entrada.
import { cmpTexto } from "./puntaje";
import { diasEntre, estadoVigencia, type Umbrales } from "./vigencia";

export interface EvidenciaDeAlerta {
  id: string;
  plataforma_id: string;
  fecha_verificacion: string;
  madurez: string;
  /** Alguna de sus fuentes es del fabricante («oficial»): sin ninguna, es un tercero lo que sostiene la afirmación. */
  fuente_oficial: boolean;
}

export type MotivoAlertaEvidencia =
  "sin-fuente-oficial" | "vencida" | "por-revisar" | "vista-previa";

export interface AlertaEvidencia {
  evidencia_id: string;
  plataforma_id: string;
  motivo: MotivoAlertaEvidencia;
  /** Días desde la verificación hasta la fecha de evaluación. */
  dias: number;
  madurez: string;
}

const ORDEN: Record<MotivoAlertaEvidencia, number> = {
  "sin-fuente-oficial": 0,
  vencida: 1,
  "por-revisar": 2,
  "vista-previa": 3,
};

export function alertasDeEvidencias(
  evidencias: readonly EvidenciaDeAlerta[],
  o: {
    fecha: string;
    vigencia: Umbrales;
    disponible: Readonly<Record<string, boolean>>;
  },
): AlertaEvidencia[] {
  const out: AlertaEvidencia[] = [];
  for (const e of evidencias) {
    const dias = diasEntre(e.fecha_verificacion, o.fecha);
    const comun = {
      evidencia_id: e.id,
      plataforma_id: e.plataforma_id,
      dias,
      madurez: e.madurez,
    };
    if (!e.fuente_oficial) out.push({ ...comun, motivo: "sin-fuente-oficial" });
    const estado = estadoVigencia(dias, o.vigencia);
    if (estado !== "vigente")
      out.push({
        ...comun,
        motivo: estado === "vencida" ? "vencida" : "por-revisar",
      });
    // Una madurez que la escala no conoce no se da por disponible.
    if (o.disponible[e.madurez] !== true)
      out.push({ ...comun, motivo: "vista-previa" });
  }
  return out.sort(
    (a, b) =>
      ORDEN[a.motivo] - ORDEN[b.motivo] ||
      cmpTexto(a.plataforma_id, b.plataforma_id) ||
      cmpTexto(a.evidencia_id, b.evidencia_id),
  );
}
