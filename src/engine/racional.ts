// Racionales exactos para la sensibilidad (RF-04.5): el total de cada plataforma es lineal en el peso que se mueve,
// así que todo punto de inversión, de entrada o de salida del empate es un cociente de enteros. Se guardan reducidos,
// con el denominador positivo, y se comparan multiplicando en cruz. Las cotas del dato (pesos en centésimas ≤ 10 000,
// puntajes ≤ 4) dejan cada producto por debajo de 2^53; `seguro` lo comprueba donde importa.

export interface Racional {
  readonly n: number;
  readonly d: number;
}

/** Lanza si un entero intermedio dejó de ser exacto en doble precisión. */
export function seguro(x: number): number {
  if (!Number.isSafeInteger(x)) throw new Error(`núcleo: el entero ${x} ya no es exacto`);
  return x;
}

function mcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

export function racional(n: number, d = 1): Racional {
  if (d === 0) throw new Error("núcleo: denominador cero");
  seguro(n);
  seguro(d);
  const g = mcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  // `+ 0` normaliza el −0.
  return { n: (s * n) / g + 0, d: (s * d) / g };
}

/** Negativo, cero o positivo según a < b, a = b o a > b. */
export function comparar(a: Racional, b: Racional): number {
  return Math.sign(seguro(a.n * b.d) - seguro(b.n * a.d));
}

/** ⌊a / b⌋ para enteros, con b > 0, sin pasar por un cociente en coma flotante. */
function divPiso(a: number, b: number): number {
  const r = ((a % b) + b) % b;
  return (a - r) / b;
}

/** El menor múltiplo de `paso` que es ≥ r. */
export function techoA(r: Racional, paso: number): number {
  return (0 - divPiso(-r.n, seguro(r.d * paso))) * paso;
}

/** El mayor múltiplo de `paso` que es ≤ r. */
export function pisoA(r: Racional, paso: number): number {
  return divPiso(r.n, seguro(r.d * paso)) * paso;
}
