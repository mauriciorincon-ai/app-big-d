// Métricas de texto como DATO (G15): anchos por suma de avances de la tabla de la fuente, con un margen de
// 3 % (103/100) porque la tabla no trae kerning (cota superior, P12). Todo en enteros: la comparación
// «¿cabe?» es exacta y el ancho se redondea hacia arriba a décimas. Jamás se mide en el navegador.
import tabla from "../../metricas/metricas.json";
import { dividirRedondeando, type Decimas } from "../util/numeros";

export interface FuenteMetricas {
  unidades_por_em: number;
  ascendente: number;
  descendente: number;
  pesos: Record<string, Record<string, number>>;
}
export interface TablaMetricas {
  fuentes: Record<string, FuenteMetricas>;
}

/** Tabla del piloto: Space Grotesk y JetBrains Mono, subconjunto latino (§ 5.5). */
export const METRICAS_PILOTO = tabla as unknown as TablaMetricas;

const MARGEN_NUM = 103;
const MARGEN_DEN = 100;

export interface Medidor {
  /** Suma de avances (unidades de la fuente) de `texto` en `peso`. Falla con un carácter fuera de la tabla. */
  avances(texto: string, peso: number): number;
  /** Ancho en décimas, redondeado hacia arriba. */
  ancho(texto: string, tamano: number, peso: number): Decimas;
  /** ¿Cabe `texto` en `max` décimas? Comparación exacta. */
  cabe(texto: string, tamano: number, peso: number, max: Decimas): boolean;
  /** Corte voraz por espacios, sin partir un paréntesis corto (§ 5.3). Devuelve las líneas y las palabras que no caben solas en `max`. */
  partir(texto: string, tamano: number, peso: number, max: Decimas): { lineas: string[]; anchas: string[] };
  /** Recorta por palabras con «…» hasta caber (D6: el texto entero vive en la ficha y en la lectura). */
  abreviar(texto: string, tamano: number, peso: number, max: Decimas): string;
  /** Línea base, en décimas, del texto de `tamano` centrado en una caja de línea `lh` que empieza en `arriba`. */
  base(arriba: Decimas, tamano: number, lh: number): Decimas;
}

export function medidor(fuente: FuenteMetricas): Medidor {
  const upem = fuente.unidades_por_em;
  const asc = fuente.ascendente;
  const desc = -fuente.descendente;
  const avances = (texto: string, peso: number): number => {
    const tablaPeso = fuente.pesos[String(peso)];
    if (!tablaPeso) throw new Error(`la tabla no tiene el peso ${peso}`);
    let suma = 0;
    for (const c of texto) {
      const a = tablaPeso[String(c.codePointAt(0))];
      if (a === undefined) throw new Error(`carácter fuera de la tabla de métricas: «${c}» en «${texto}»`);
      suma += a;
    }
    return suma;
  };
  // ancho (u) = avances · tamaño · 103 / (100 · upem); en décimas, ×10.
  const ancho = (texto: string, tamano: number, peso: number): Decimas => {
    const num = avances(texto, peso) * tamano * MARGEN_NUM * 10;
    const den = MARGEN_DEN * upem;
    return Math.floor((num + den - 1) / den);
  };
  const cabe = (texto: string, tamano: number, peso: number, max: Decimas): boolean =>
    avances(texto, peso) * tamano * MARGEN_NUM * 10 <= max * MARGEN_DEN * upem;
  // § 5.3 (0.4.0): un paréntesis corto —el que cabe entero en una línea— no se parte: «Compute capacity (F SKU)»
  // jamás corta entre «(F» y «SKU)». Sus palabras viajan juntas como una sola pieza del corte voraz.
  const piezas = (texto: string, tamano: number, peso: number, max: Decimas): string[] => {
    const palabras = texto.split(" ");
    const abierto = (p: string) => p.split("(").length > p.split(")").length;
    const out: string[] = [];
    for (let i = 0; i < palabras.length; i++) {
      const cierre = abierto(palabras[i]!) ? palabras.findIndex((p, j) => j > i && p.includes(")")) : -1;
      const junto = cierre > i ? palabras.slice(i, cierre + 1).join(" ") : "";
      if (junto && cabe(junto, tamano, peso, max)) {
        out.push(junto);
        i = cierre;
      } else out.push(palabras[i]!);
    }
    return out;
  };
  const partir = (texto: string, tamano: number, peso: number, max: Decimas) => {
    const lineas: string[] = [];
    const anchas: string[] = [];
    let actual = "";
    for (const palabra of piezas(texto, tamano, peso, max)) {
      const candidata = actual ? `${actual} ${palabra}` : palabra;
      if (cabe(candidata, tamano, peso, max)) actual = candidata;
      else {
        if (actual) lineas.push(actual);
        actual = palabra;
        if (!cabe(palabra, tamano, peso, max)) anchas.push(palabra);
      }
    }
    if (actual) lineas.push(actual);
    return { lineas, anchas };
  };
  const abreviar = (texto: string, tamano: number, peso: number, max: Decimas): string => {
    if (cabe(texto, tamano, peso, max)) return texto;
    const palabras = texto.split(" ");
    for (let n = palabras.length - 1; n >= 1; n--) {
      const corto = `${palabras.slice(0, n).join(" ")}…`;
      if (cabe(corto, tamano, peso, max)) return corto;
    }
    return "…";
  };
  // base = arriba + (lh − (asc + desc)·t/upem)/2 + asc·t/upem = arriba + (lh·upem + (asc − desc)·t) / (2·upem)
  const base = (arriba: Decimas, tamano: number, lh: number): Decimas =>
    arriba + dividirRedondeando(10 * (lh * upem + (asc - desc) * tamano), 2 * upem);
  return { avances, ancho, cabe, partir, abreviar, base };
}
