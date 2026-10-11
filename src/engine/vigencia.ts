// Vigencia de una evidencia (RF-01.5) contra la fecha de evaluación del caso, que es una ENTRADA: el núcleo no lee el
// reloj (regla dura 1). Días civiles enteros desde una época fija, el mismo algoritmo del diagramador
// (`packages/diagramador/src/util/fechas.ts`), copiado porque el paquete es una copia fijada y no lo exporta.

function diaCivil(fecha: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) throw new Error(`núcleo: fecha no civil «${fecha}»`);
  let a = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes <= 2) a -= 1;
  const era = Math.floor(a / 400);
  const ade = a - era * 400;
  const mp = (mes + 9) % 12;
  const ddea = Math.floor((153 * mp + 2) / 5) + dia - 1;
  const dde = ade * 365 + Math.floor(ade / 4) - Math.floor(ade / 100) + ddea;
  return era * 146097 + dde;
}

/** Días enteros de `desde` a `hasta` (positivo si `hasta` es posterior). */
export function diasEntre(desde: string, hasta: string): number {
  return diaCivil(hasta) - diaCivil(desde);
}

export type EstadoVigencia = "vigente" | "por-revisar" | "vencida";

export interface Umbrales {
  revisar_dias: number;
  vencido_dias: number;
}

/** El estado a `dias` de la verificación: por revisar desde el primer umbral, vencida desde el segundo. */
export function estadoVigencia(dias: number, u: Umbrales): EstadoVigencia {
  return dias >= u.vencido_dias ? "vencida" : dias >= u.revisar_dias ? "por-revisar" : "vigente";
}
