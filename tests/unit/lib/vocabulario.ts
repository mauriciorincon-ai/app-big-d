// Vocabulario vetado (design-system.md § 8): calcos de la traducción automática y relleno. Lo usan el gate de
// la maqueta y el de los datos del atlas (M-8 de la auditoría del S1: el mapa aprobado de Fabric decía «lago de
// datos» y nadie lo miraba fuera de la maqueta).
export const VETADAS: Array<[RegExp, string]> = [
  [/casa del lago/i, "calco de «lakehouse» (mercado § 6.B)"],
  [/lago de datos/i, "calco de «data lake»: se dice «data lake» y se explica en el glosario"],
  [/lorem|ipsum|TODO|FIXME|XXX/, "relleno o pendiente"],
];
