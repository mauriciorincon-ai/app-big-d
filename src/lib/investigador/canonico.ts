// JSON canónico de un dato (claves ordenadas por unidades de código, sin espacios, al estilo RFC 8785 para los tipos
// que usa el dato: cadenas, enteros, booleanos, listas y objetos). Sin `node:crypto`: lo usan también vistas que
// llegan al navegador (las versiones de un mapa); la huella, que sí lo necesita, vive en huella.ts.
export function canonico(valor: unknown): string {
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(",")}]`;
  const claves = Object.keys(valor as Record<string, unknown>)
    .filter((k) => (valor as Record<string, unknown>)[k] !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${claves.map((k) => `${JSON.stringify(k)}:${canonico((valor as Record<string, unknown>)[k])}`).join(",")}}`;
}
