import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

// La carpeta de datos del build (D-S3-14, regla 17-bis b). Por omisión, data/ del repo. La perilla BIGD_DATOS apunta
// a un árbol de prueba (la base sembrada de las capturas, del kit y de las e2e de estados que el dato real aún no
// tiene) y se declara al arrancar (next.config.ts). Jamás se publica: en un build de Vercel la perilla es un error.
export function dirDatos(entorno: Record<string, string | undefined> = process.env, cwd = process.cwd()): string {
  const perilla = entorno.BIGD_DATOS;
  if (perilla === undefined || perilla === "") return join(cwd, "data");
  if (entorno.VERCEL) throw new Error("BIGD_DATOS está puesta en un build de Vercel: la publicación usa siempre data/");
  const dir = isAbsolute(perilla) ? perilla : resolve(cwd, perilla);
  if (!existsSync(dir)) throw new Error(`BIGD_DATOS apunta a una carpeta que no existe: ${dir}`);
  return dir;
}
