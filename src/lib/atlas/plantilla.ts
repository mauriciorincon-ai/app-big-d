// Plantillas de interfaz con {marcas} y plural [uno, varios]. Una marca sin valor queda escrita tal cual:
// así un dato que falta se VE en la página en vez de desaparecer.
export function plantilla(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (marca, clave: string) => (clave in valores ? String(valores[clave]) : marca));
}

export function plural(formas: readonly [string, string], n: number): string {
  return plantilla(n === 1 ? formas[0] : formas[1], { n });
}
