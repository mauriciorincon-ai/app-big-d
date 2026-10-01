// Vocabulario vetado (design-system.md § 8): calcos de la traducción automática y relleno. Lo usan el gate de la
// maqueta, el de los datos del atlas (M-8 de la auditoría del S1: el mapa aprobado de Fabric decía «lago de datos»)
// y la validación de cada propuesta del investigador, para que el calco no llegue a la revisión: «data lake» es el
// nombre real y no se traduce (la persona, 2026-09-30).
export const VETADAS: Array<[RegExp, string]> = [
  [/casa del lago/i, "calco de «lakehouse» (mercado § 6.B)"],
  [/lago de datos/i, "calco de «data lake»: se dice «data lake» y se explica en el glosario"],
  [/lorem|ipsum|TODO|FIXME|XXX/, "relleno o pendiente"],
];

/** Cada texto de un dato con su ruta (JSON Pointer). */
export function textosConRuta(v: unknown, ruta = ""): [string, string][] {
  if (typeof v === "string") return [[ruta, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => textosConRuta(x, `${ruta}/${i}`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => textosConRuta(x, `${ruta}/${k}`));
  return [];
}

/** Cada texto vetado de un dato: su ruta y por qué. */
export function vocabularioVetado(dato: unknown): { ruta: string; que: string }[] {
  return textosConRuta(dato).flatMap(([ruta, t]) => VETADAS.filter(([re]) => re.test(t)).map(([, que]) => ({ ruta, que })));
}
