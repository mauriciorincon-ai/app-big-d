// Orden estable por unidades de código UTF-16 (D3): nunca `localeCompare`, que depende del motor y de su
// configuración regional (G1, G2).

export function compararCodigo(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Copia ordenada por una o varias claves; las claves de texto se comparan por unidades de código. */
export function ordenarPor<T>(lista: readonly T[], ...claves: ((x: T) => string | number)[]): T[] {
  return [...lista].sort((x, y) => {
    for (const clave of claves) {
      const a = clave(x);
      const b = clave(y);
      const c = typeof a === "number" && typeof b === "number" ? a - b : compararCodigo(String(a), String(b));
      if (c !== 0) return c;
    }
    return 0;
  });
}
