// Lo que escribe la aprobación del perfil del caso (S4, D-S4-03): el perfil `aprobado` con su sello y la línea de la revisión.
// Puro: recibe el borrador, la huella `desde` del comando y las decisiones; devuelve el caso y la línea. Las lee y las
// escribe scripts/aprobar.mjs (modo --caso), que solo una persona corre. Corre en Node (usa SHA-256).
import { z } from "zod";
import { esquemaCaso, type Caso } from "@/lib/datos/conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";
import { problemasDelPerfil, type DecisionesPerfil } from "./comando-caso";

/** La línea de data/revisiones/casos/<id>.jsonl: qué borrador (`desde`) se aprobó y la huella del perfil aprobado. */
export const esquemaRevisionCaso = z.strictObject({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  caso: z.string().min(1),
  desde: z.string().regex(/^[0-9a-f]{64}$/),
  huella: z.string().regex(/^[0-9a-f]{64}$/),
});
export type RevisionCaso = z.infer<typeof esquemaRevisionCaso>;

export class ErrorDeAprobacionDeCaso extends Error {}

/**
 * Aprueba el borrador con lo que la persona fijó. Se niega si el borrador ya no es aquel sobre el que se armó el comando
 * (`desde`), si las decisiones no se pueden aprobar, o si el resultado no pasa el esquema. Cada peso queda
 * `declarado-por-usuario`: la persona los aprobó todos, también los que dejó como estaban.
 */
export function aprobarCaso(
  borrador: Caso,
  desde: string,
  d: DecisionesPerfil,
  fecha: string,
): { caso: Caso; revision: RevisionCaso } {
  if (borrador.estado_aprobacion !== "borrador")
    throw new ErrorDeAprobacionDeCaso(
      `«${borrador.id}» ya está aprobado: un perfil aprobado no se edita, se aprueba otro borrador`,
    );
  if (huellaCaso(borrador) !== desde)
    throw new ErrorDeAprobacionDeCaso(
      "el borrador cambió desde que se armó el comando: vuelve a abrir la pantalla del perfil y arma el comando otra vez",
    );
  const problemas = problemasDelPerfil(borrador, d);
  if (problemas.length) throw new ErrorDeAprobacionDeCaso(problemas.join("\n"));
  const perfil: Caso = {
    ...borrador,
    criterios: borrador.criterios.map((k) => ({
      ...k,
      peso_centesimas: d.pesos[k.criterio_id]!,
      rango_relativo_pct: d.rangos[k.criterio_id]!,
      origen: "declarado-por-usuario" as const,
    })),
    restricciones: borrador.restricciones.filter((r) =>
      d.restricciones.includes(r.id),
    ),
    decisiones_implicitas: borrador.decisiones_implicitas.map((x) => ({
      ...x,
      respuesta: d.respuestas[x.id]!,
    })),
    estado_aprobacion: "aprobado",
  };
  const huella = huellaCaso(perfil);
  const caso = esquemaCaso.parse({ ...perfil, aprobacion: { fecha, huella } });
  return {
    caso,
    revision: esquemaRevisionCaso.parse({
      fecha,
      caso: caso.id,
      desde,
      huella,
    }),
  };
}
