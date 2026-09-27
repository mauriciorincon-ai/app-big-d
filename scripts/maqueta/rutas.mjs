// Rutas del generador de la maqueta, relativas al repo. La salida por defecto es docs/diseno/;
// MAQUETA_SALIDA la desvía (la usa el gate de deriva para generar en un directorio temporal).
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
export const RAIZ = resolve(AQUI, "../..");
export const ENTRADA = resolve(AQUI, "entrada");
export const METRICAS = resolve(RAIZ, "docs/diseno/assets/fuentes/metricas.json");
export const SALIDA = resolve(process.env.MAQUETA_SALIDA ?? resolve(RAIZ, "docs/diseno"));
export const sal = (archivo) => resolve(SALIDA, archivo);
