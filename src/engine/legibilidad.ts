// El presupuesto de lectura del resumen para quien decide (S6, E-13, regla dura 11): un texto de líder se lee en voz alta en
// menos de 20 s si tiene hasta `palabras_max` palabras O hasta `silabas_max` sílabas, y a lo sumo `terminos_max` términos a
// explicar. Las cifras vienen del dato (data/convenciones/informe.yaml); aquí solo hay reglas. Puro y entero: sin reloj, sin
// azar, sin `Intl` ni `toLocale*`; la misma entrada da el mismo resultado en Node y en el navegador (regla dura 1).
//
// Contar sílabas no tiene regla exacta en ningún idioma, y esta es una estimación DECLARADA, no un oráculo. Por eso el
// presupuesto es una disyunción: cualquiera de las dos medidas basta, y la de palabras es exacta.
//   · Una palabra es una secuencia de letras (con apóstrofo interior en inglés) o un número con sus separadores decimales.
//   · Un número cuenta como una palabra y NUMERO_SILABAS sílabas (leído en voz alta rara vez cabe en menos).
//   · Una sigla sin vocales («SQL») cuenta tantas sílabas como letras: se deletrea.
//   · Español: cada grupo de vocales da una sílaba, más una por cada hiato (dos vocales fuertes juntas, o una débil
//     acentuada junto a otra vocal). «qu» y «gu» ante e/i no cuentan la u; «y» al final tras vocal es vocal débil; la h
//     separa, así que «prohibir» da tres.
//   · Inglés: cada grupo de vocales (con «y») da una sílaba; la «e» final muda, «es» y «ed» finales mudas (salvo tras
//     sibilante o t/d) restan una; la «y» inicial ante vocal es consonante; mínimo una por palabra. Falla en «idea»
//     o «radio» (cuenta una menos): el presupuesto de palabras es el que decide en esos casos.
//   · Un término a explicar se cuenta una vez por texto, como palabra completa y sin distinguir mayúsculas (la misma
//     regla de V9 del diagramador, que esta app escribe por su cuenta porque sus ayudantes no son API pública).

export type IdiomaLectura = "es" | "en";

export interface PresupuestoDeLectura {
  palabras_max: number;
  silabas_max: number;
  terminos_max: number;
}

/** Un término a explicar y las formas con que aparece en el texto (la forma canónica va incluida). */
export interface TerminoAExplicar {
  id: string;
  formas: readonly string[];
}

export interface Lectura {
  palabras: number;
  silabas: number;
  /** Los ids de los términos que aparecen, en el orden de la lista recibida. */
  terminos: string[];
  por_palabras: boolean;
  por_silabas: boolean;
  terminos_ok: boolean;
  cumple: boolean;
}

/** Sílabas que cuenta un número: lo que tarda en leerse en voz alta, no su cantidad de dígitos. */
export const NUMERO_SILABAS = 3;

const PALABRA = /\d+(?:[.,]\d+)*|\p{L}+(?:['’]\p{L}+)*/gu;
const ES_NUMERO = /^\d/;

/** Las palabras de un texto, en orden. */
export function palabrasDe(texto: string): string[] {
  return texto.match(PALABRA) ?? [];
}

const FUERTES_ES = new Set(["a", "e", "o", "á", "é", "ó"]);
const DEBILES_ACENTUADAS_ES = new Set(["í", "ú"]);
const VOCALES_ES = new Set([
  ...FUERTES_ES,
  ...DEBILES_ACENTUADAS_ES,
  "i",
  "u",
  "ü",
]);

/** Sílabas de una palabra en español (ver las reglas arriba). Mínimo una. */
export function silabasEs(palabra: string): number {
  const w = palabra.normalize("NFC").toLowerCase();
  const letras = [...w];
  const esVocal = (i: number): boolean => {
    const c = letras[i]!;
    if (c === "y")
      return (
        i === letras.length - 1 &&
        (letras.length === 1 || VOCALES_ES.has(letras[i - 1]!))
      );
    if (!VOCALES_ES.has(c)) return false;
    // La u de «qu» y de «gu» ante e/i no suena.
    if (
      c === "u" &&
      (letras[i - 1] === "q" ||
        (letras[i - 1] === "g" && "eiéí".includes(letras[i + 1] ?? "")))
    )
      return false;
    return true;
  };
  let total = 0;
  let i = 0;
  while (i < letras.length) {
    if (!esVocal(i)) {
      i += 1;
      continue;
    }
    let nucleos = 1;
    let previa = letras[i]!;
    i += 1;
    while (i < letras.length && esVocal(i)) {
      const c = letras[i]!;
      const hiato =
        (FUERTES_ES.has(previa) && FUERTES_ES.has(c)) ||
        DEBILES_ACENTUADAS_ES.has(previa) ||
        DEBILES_ACENTUADAS_ES.has(c);
      if (hiato) nucleos += 1;
      previa = c;
      i += 1;
    }
    total += nucleos;
  }
  // Sin vocales (una sigla): se deletrea.
  return total === 0 ? letras.length : total;
}

/** Sílabas de una palabra en inglés (ver las reglas arriba). Mínimo una. */
export function silabasEn(palabra: string): number {
  const w = palabra.normalize("NFC").toLowerCase().replace(/['’]/g, "");
  if (!/[aeiouy]/.test(w)) return Math.max(1, w.length);
  // La «y» inicial ante vocal («yes», «you») es consonante.
  const sinY = /^y[aeiou]/.test(w) ? w.slice(1) : w;
  let n = sinY.match(/[aeiouy]+/g)?.length ?? 1;
  if (n > 1) {
    if (/[^aeiouy]le$/.test(sinY)) {
      // «table», «little»: la «e» final suena con la «l».
    } else if (/e$/.test(sinY) && !/[aeiouy]e$/.test(sinY)) n -= 1;
    else if (/es$/.test(sinY) && !/(?:[sxzcg]|ch|sh)es$/.test(sinY)) n -= 1;
    else if (/ed$/.test(sinY) && !/[td]ed$/.test(sinY)) n -= 1;
  }
  return Math.max(1, n);
}

/** Sílabas de una palabra (o número) del texto. */
export function silabasDe(palabra: string, idioma: IdiomaLectura): number {
  if (ES_NUMERO.test(palabra)) return NUMERO_SILABAS;
  return idioma === "es" ? silabasEs(palabra) : silabasEn(palabra);
}

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** ¿Aparece `termino` como palabra completa en `texto`? (sin distinguir mayúsculas; letras con tilde incluidas) */
export function contieneTermino(texto: string, termino: string): boolean {
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapar(termino)}(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  ).test(texto);
}

/** Mide un texto de líder contra su presupuesto. */
export function medirLectura(
  texto: string,
  idioma: IdiomaLectura,
  presupuesto: PresupuestoDeLectura,
  terminos: readonly TerminoAExplicar[],
): Lectura {
  const palabras = palabrasDe(texto);
  const silabas = palabras.reduce((s, p) => s + silabasDe(p, idioma), 0);
  const presentes = terminos
    .filter((t) => t.formas.some((f) => contieneTermino(texto, f)))
    .map((t) => t.id);
  const por_palabras = palabras.length <= presupuesto.palabras_max;
  const por_silabas = silabas <= presupuesto.silabas_max;
  const terminos_ok = presentes.length <= presupuesto.terminos_max;
  return {
    palabras: palabras.length,
    silabas,
    terminos: presentes,
    por_palabras,
    por_silabas,
    terminos_ok,
    cumple: (por_palabras || por_silabas) && terminos_ok,
  };
}
