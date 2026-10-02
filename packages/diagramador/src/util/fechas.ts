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

/** La fecha civil `dias` después de `fecha` (negativo: antes). Inversa entera de `diaCivil`, sin `Date` (G2). */
export function sumarDias(fecha: string, dias: number): string {
  const z = diaCivil(fecha) + dias;
  const era = Math.floor(z / 146097);
  const dde = z - era * 146097;
  const ade = Math.floor((dde - Math.floor(dde / 1460) + Math.floor(dde / 36524) - Math.floor(dde / 146096)) / 365);
  const ddea = dde - (365 * ade + Math.floor(ade / 4) - Math.floor(ade / 100));
  const mp = Math.floor((5 * ddea + 2) / 153);
  const dia = ddea - Math.floor((153 * mp + 2) / 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  const a = ade + era * 400 + (mes <= 2 ? 1 : 0);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${String(a).padStart(4, "0")}-${dos(mes)}-${dos(dia)}`;
}
