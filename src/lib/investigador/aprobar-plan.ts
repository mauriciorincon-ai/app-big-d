// Lo que escribe la aprobación del plan del caso (S5, D-S5-09): el plan `aprobado` con su sello y la línea de la revisión.
// Puro: recibe el borrador y la huella `desde` del comando; devuelve el plan y la línea. Las lee y las escribe el script de
// aprobación en su modo del plan, que solo una persona corre. Corre en Node (usa SHA-256).
import { informeDeInstrumentos } from "instrumentos-de-plan";
import { z } from "zod";
import { huellaPlan } from "@/lib/datos/instantanea";
import {
  esquemaModoDeFalla,
  esquemaSupuesto,
  type Plan,
} from "@/lib/datos/plan";

/** La línea de data/revisiones/planes/<caso>.jsonl: qué borrador (`desde`) se aprobó y la huella del plan aprobado. */
export const esquemaRevisionPlan = z.strictObject({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  caso: z.string().min(1),
  desde: z.string().regex(/^[0-9a-f]{64}$/),
  huella: z.string().regex(/^[0-9a-f]{64}$/),
});
export type RevisionPlan = z.infer<typeof esquemaRevisionPlan>;

export class ErrorDeAprobacionDePlan extends Error {}

/**
 * Aprueba el borrador tal como lo vio la persona. Se niega si el plan ya está aprobado, si el borrador ya no es aquel sobre
 * el que se armó el comando (`desde`) o si tiene bloqueantes (un ciclo, una acción alta sin mitigación, un supuesto crítico
 * sin prueba barata). Cada riesgo y cada supuesto queda `declarado-por-usuario`: la persona los aprobó todos, también los
 * que el agente propuso y ella dejó como estaban.
 */
export function aprobarPlan(
  borrador: Plan,
  desde: string,
  fecha: string,
): { plan: Plan; revision: RevisionPlan } {
  if (borrador.estado_aprobacion !== "borrador")
    throw new ErrorDeAprobacionDePlan(
      `el plan de «${borrador.caso_id}» ya está aprobado: un plan aprobado no se edita, se aprueba otro borrador`,
    );
  if (huellaPlan(borrador) !== desde)
    throw new ErrorDeAprobacionDePlan(
      "el borrador cambió desde que se armó el comando: vuelve a abrir la pantalla de decisiones y arma el comando otra vez",
    );
  const informe = informeDeInstrumentos({
    decisiones: borrador.decisiones,
    modos_de_falla: borrador.modos_de_falla,
    supuestos: borrador.supuestos,
  });
  if (!informe.ok)
    throw new ErrorDeAprobacionDePlan(
      `el plan no se puede aprobar:\n${informe.bloqueantes.map((b) => `${b.tipo}: ${b.ids.join(", ")}`).join("\n")}`,
    );
  const aprobado: Plan = {
    ...borrador,
    modos_de_falla: borrador.modos_de_falla.map((m) =>
      esquemaModoDeFalla.parse({ ...m, origen: "declarado-por-usuario" }),
    ),
    supuestos: borrador.supuestos.map((s) =>
      esquemaSupuesto.parse({ ...s, origen: "declarado-por-usuario" }),
    ),
    estado_aprobacion: "aprobado",
  };
  const huella = huellaPlan(aprobado);
  return {
    plan: { ...aprobado, aprobacion: { fecha, huella } },
    revision: esquemaRevisionPlan.parse({
      fecha,
      caso: borrador.caso_id,
      desde,
      huella,
    }),
  };
}
