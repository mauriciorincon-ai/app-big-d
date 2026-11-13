// S9 (F1): el detector de jerga (regla dura 11; decisions/jargon-detector.md § 3). Puro y entero: cada palabra del texto cae en
// un CUBO de frecuencia (1 = la más usada) según una tabla del dato, derivada de textos del propio proyecto, y se marca la que
// no está en la tabla o cae en un cubo más raro que el umbral, salvo las permitidas del dato y los términos que el informe ya
// explica en su glosario. Sin reloj, sin flotantes, sin `Intl`: el mismo texto da la misma lista en Node y en el navegador.
import { palabrasDe } from "./legibilidad";

/** La tabla de UN idioma: `cubos` solo trae las palabras comunes (cubo ≤ umbral); cualquier otra es rara. */
export interface TablaDeJerga {
  /** Las palabras de menos letras que esto no se juzgan (artículos, preposiciones). */
  largo_minimo: number;
  /** El cubo más raro que aún cuenta como común. */
  umbral_cubo: number;
  cubos: Readonly<Record<string, number>>;
}

const ES_NUMERO = /^\d/;

/** La forma en que una palabra se busca en la tabla: NFC y minúsculas, sin depender de la configuración regional. */
export const formaDePalabra = (p: string): string => p.normalize("NFC").toLowerCase();

/**
 * Las palabras raras del texto, sin repetir y en orden de unidades de código. `permitidas`: nombres propios y términos que
 * el dato declara aceptables. `explicadas`: las formas de los términos que el glosario del informe ya explica.
 */
export function detectarJerga(
  texto: string,
  tabla: TablaDeJerga,
  permitidas: readonly string[],
  explicadas: readonly string[] = [],
): string[] {
  const libres = new Set([...permitidas, ...explicadas].map(formaDePalabra));
  const raras = new Set<string>();
  for (const p of palabrasDe(texto)) {
    if (ES_NUMERO.test(p)) continue;
    const w = formaDePalabra(p);
    if ([...w].length < tabla.largo_minimo || libres.has(w)) continue;
    const cubo = Object.hasOwn(tabla.cubos, w) ? tabla.cubos[w]! : undefined;
    if (cubo === undefined || cubo > tabla.umbral_cubo) raras.add(w);
  }
  return [...raras].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** El cubo de una cuenta de apariciones (la regla con que se deriva la tabla: scripts/jerga/derivar.mjs). */
export function cuboDeCuenta(cuenta: number): number {
  return cuenta >= 50 ? 1 : cuenta >= 10 ? 2 : cuenta >= 3 ? 3 : 4;
}
