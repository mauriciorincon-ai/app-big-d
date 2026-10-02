// Números del SVG (G1): toda coordenada vive como ENTERO en décimas de unidad y se escribe con una sola
// función canónica. Nada de `toFixed`, `toLocaleString` ni `Intl`: el texto sale de aritmética entera, igual
// en Node y en los tres motores.

/** Décimas de unidad: el entero con que el motor calcula toda la geometría. */
export type Decimas = number;

/** Escribe un entero en décimas: 1234 → «123.4», 1230 → «123», -5 → «-0.5», -0 → «0». */
export function fmt(d: Decimas): string {
  if (!Number.isSafeInteger(d)) throw new Error(`fmt: se esperaba un entero en décimas y llegó ${d}`);
  if (d === 0) return "0";
  const signo = d < 0 ? "-" : "";
  const abs = d < 0 ? -d : d;
  const entero = Math.floor(abs / 10);
  const decima = abs % 10;
  return decima === 0 ? `${signo}${entero}` : `${signo}${entero}.${decima}`;
}

/** Unidades enteras → décimas. */
export const u = (n: number): Decimas => {
  if (!Number.isSafeInteger(n)) throw new Error(`u: se esperaba un entero y llegó ${n}`);
  return n * 10;
};

/**
 * Cociente `num / den` redondeado al entero más cercano, con las mitades hacia +∞ (como `Math.round`), en
 * aritmética entera exacta. `den` > 0.
 */
export function dividirRedondeando(num: number, den: number): number {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den <= 0) throw new Error(`dividirRedondeando(${num}, ${den})`);
  return Math.floor((2 * num + den) / (2 * den));
}

/** Mitad de un valor en décimas, redondeada como `dividirRedondeando`. */
export const mitad = (d: Decimas): Decimas => dividirRedondeando(d, 2);
