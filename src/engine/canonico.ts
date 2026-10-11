// JSON canónico estricto (RFC 8785, JCS) para la huella del núcleo (RF-01.4, RF-06.5). El núcleo solo produce
// enteros, textos, booleanos, listas y objetos planos: así la serialización es inequívoca en todo motor (el
// `toString` de un número con decimales no lo es en su último dígito). Lo que no cabe en esa forma se rechaza en vez
// de serializarse a medias: NaN, ±∞, un número no entero o fuera del rango exacto, un hueco en una lista, un objeto
// que no es plano y un texto con un sustituto suelto (RFC 8785 exige I-JSON). El −0 se escribe 0.
// Sin `node:crypto`: el texto que sale de aquí lo convierte en huella quien lo llama (Node o `crypto.subtle`).

const SUSTITUTO_SUELTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function falla(ruta: string, que: string): never {
  throw new Error(`canónico: ${ruta || "/"} ${que}`);
}

function serializar(v: unknown, ruta: string): string {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) falla(ruta, `no es un entero exacto: ${String(v)}`);
    return String(v + 0);
  }
  if (typeof v === "string") {
    if (SUSTITUTO_SUELTO.test(v)) falla(ruta, "trae un sustituto UTF-16 suelto");
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    const partes: string[] = [];
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) falla(`${ruta}/${i}`, "es un hueco");
      partes.push(serializar(v[i], `${ruta}/${i}`));
    }
    return `[${partes.join(",")}]`;
  }
  if (typeof v === "object") {
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) falla(ruta, "no es un objeto plano");
    const o = v as Record<string, unknown>;
    // Orden por unidades de código UTF-16, independiente del idioma del sistema (RFC 8785 § 3.2.3).
    const claves = Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${claves.map((k) => `${serializar(k, ruta)}:${serializar(o[k], `${ruta}/${k}`)}`).join(",")}}`;
  }
  return falla(ruta, `no es serializable (${typeof v})`);
}

/** El JSON canónico de un valor del núcleo; lanza con la ruta si algo no cabe en la forma estricta. */
export function canonicoEstricto(valor: unknown): string {
  return serializar(valor, "");
}
