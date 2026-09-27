// Cobertura de una fuente (V15, G15): el conjunto de puntos de código que su tabla de métricas cubre.
import type { Cobertura } from "../validar/reglas-mapa";

/** Desde rangos cerrados `[[desde, hasta], …]` (la forma de `metricas/cobertura.json`). */
export function coberturaDeRangos(rangos: readonly (readonly [number, number])[]): Cobertura {
  const ordenados = [...rangos].sort((a, b) => a[0] - b[0]);
  return {
    has(cp: number): boolean {
      let lo = 0;
      let hi = ordenados.length - 1;
      while (lo <= hi) {
        const medio = (lo + hi) >> 1;
        const [a, b] = ordenados[medio]!;
        if (cp < a) hi = medio - 1;
        else if (cp > b) lo = medio + 1;
        else return true;
      }
      return false;
    },
  };
}
