// Fechas civiles «AAAA-MM-DD» sin reloj ni `Date` (G2): la diferencia en días sale de un conteo entero de
// días desde una época fija (algoritmo de días desde el 0000-03-01 del calendario gregoriano proléptico).

function diaCivil(fecha: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) throw new Error(`fecha no civil: «${fecha}»`);
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
