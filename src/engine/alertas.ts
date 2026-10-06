// Alertas de vigencia del resultado (§ 6.7 `alertas_vigencia`, RF-01.5): cada evidencia que sustenta un puntaje y
// que, a la fecha de evaluación del caso, está por revisar (30 días) o vencida (60), o cuya madurez no es
// «disponible de forma general». La fecha es una entrada; el núcleo no lee el reloj.

import { cmpTexto } from "./puntaje";
import type { AlertaVigencia, BaseMotor, Celda } from "./tipos";
import { diasEntre, estadoVigencia } from "./vigencia";

export function alertasDe(celdas: readonly Celda[], base: BaseMotor, fecha: string): AlertaVigencia[] {
  const out: AlertaVigencia[] = [];
  for (const c of celdas)
    for (const id of c.sustento) {
      const e = base.evidencias.find((x) => x.id === id)!;
      const dias = diasEntre(e.fecha_verificacion, fecha);
      const estado = estadoVigencia(dias, base.convenciones.vigencia);
      const disponible = base.escala.topes.find((t) => t.madurez === e.madurez)!.disponible;
      const comun = { plataforma_id: c.plataforma_id, criterio_id: c.criterio_id, evidencia_id: e.id, dias, madurez: e.madurez };
      if (estado !== "vigente") out.push({ ...comun, motivo: estado });
      if (!disponible) out.push({ ...comun, motivo: "madurez" });
    }
  return out.sort((a, b) => cmpTexto(a.plataforma_id, b.plataforma_id) || cmpTexto(a.criterio_id, b.criterio_id) || cmpTexto(a.evidencia_id, b.evidencia_id) || cmpTexto(a.motivo, b.motivo));
}
