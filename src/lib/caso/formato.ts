import type { Racional } from "@/engine";
import type { Idioma } from "@/lib/i18n";

// Cómo se escriben en pantalla los números del núcleo (D-S3-06, regla 1 del motor). El núcleo entrega enteros (unidades,
// centésimas, créditos) y racionales; aquí se convierten a décimas con aritmética entera y se escriben con el separador
// del idioma, sin `Intl` ni `toLocale*` (la misma página en todo navegador). El total se REDONDEA a la décima; la brecha
// y la aceptabilidad se TRUNCAN (un 4,9975 jamás se lee «5,0», ni un 69,96 % «70,0 %»).

const SEPARADOR: Record<Idioma, { decimal: string; miles: string }> = { es: { decimal: ",", miles: " " }, en: { decimal: ".", miles: "," } };

const divPiso = (a: number, b: number) => Math.floor(a / b);

/** Un entero con separador de miles: «10 000» / «10,000» (desde cinco cifras, como la maqueta). */
export function entero(n: number, idioma: Idioma): string {
  const s = String(Math.abs(n));
  const con = s.length < 5 ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARADOR[idioma].miles);
  return n < 0 ? `−${con}` : con;
}

/** Décimas enteras escritas con un decimal: 788 → «78,8». */
export function decimas(d: number, idioma: Idioma): string {
  const signo = d < 0 ? "−" : "";
  const a = Math.abs(d);
  return `${signo}${entero(Math.floor(a / 10), idioma)}${SEPARADOR[idioma].decimal}${a % 10}`;
}

/** El total en puntos (0 a 100) de U unidades, redondeado a la décima: floor((U + 5·max) / (10·max)). */
export function puntos(U: number, max: number, idioma: Idioma): string {
  return decimas(divPiso(U + 5 * max, 10 * max), idioma);
}

/** Lo mismo para un total racional (la sensibilidad): floor((n + 5·max·d) / (10·max·d)). */
export function puntosRacional(r: Racional, max: number, idioma: Idioma): string {
  return decimas(divPiso(r.n + 5 * max * r.d, 10 * max * r.d), idioma);
}

/** El total en décimas de punto, como número (para dibujar): mismo redondeo que `puntos`. */
export function decimasDe(U: number, max: number): number {
  return divPiso(U + 5 * max, 10 * max);
}

/** Una brecha en puntos, TRUNCADA a la décima: floor(U / (10·max)). */
export function brecha(U: number, max: number, idioma: Idioma): string {
  return decimas(divPiso(U, 10 * max), idioma);
}

/** Un peso en centésimas escrito en puntos: 2500 → «25», 1480 → «14,8», 1475 → «14,75». */
export function peso(c: number, idioma: Idioma): string {
  const ent = entero(Math.floor(c / 100), idioma);
  const resto = c % 100;
  if (!resto) return ent;
  return `${ent}${SEPARADOR[idioma].decimal}${resto % 10 ? String(resto).padStart(2, "0") : String(resto / 10)}`;
}

/** Una parte de un total en por ciento, TRUNCADA a la décima: floor(1000·parte / total) → «99,4». */
export function porcentaje(parte: number, total: number, idioma: Idioma): string {
  return decimas(Number((BigInt(parte) * BigInt(1000)) / BigInt(total)), idioma);
}

/** La misma parte en décimas de por ciento (para dibujar barras), truncada. */
export function porMil(parte: number, total: number): number {
  return Number((BigInt(parte) * BigInt(1000)) / BigInt(total));
}

/** Una semiamplitud en centésimas de punto porcentual, escrita en décimas (truncada): 87 → «0,8». */
export function semiamplitud(centesimas: number, idioma: Idioma): string {
  return decimas(Math.floor(centesimas / 10), idioma);
}

/** El número ordinal del puesto en cada idioma: «1.er», «2.º» / «1st», «2nd». */
export function ordinal(k: number, idioma: Idioma): string {
  if (idioma === "es") return k === 1 || k === 3 ? `${k}.er` : `${k}.º`;
  const d = k % 10;
  const dd = k % 100;
  return `${k}${d === 1 && dd !== 11 ? "st" : d === 2 && dd !== 12 ? "nd" : d === 3 && dd !== 13 ? "rd" : "th"}`;
}

/** Una lista de nombres con la conjunción del idioma: «A», «A y B», «A, B y C». */
export function lista(nombres: readonly string[], y: string): string {
  if (nombres.length < 2) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")}${y}${nombres.at(-1)}`;
}

/** Una huella SHA-256 abreviada como en la maqueta: los 6 primeros y los 4 últimos. */
export function huellaCorta(h: string): { inicio: string; fin: string } {
  return { inicio: h.slice(0, 6), fin: h.slice(-4) };
}
