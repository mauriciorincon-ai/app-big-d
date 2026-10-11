import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Validacion } from "@/engine";
import { dirDatos } from "@/lib/datos/dir";

/**
 * El resultado de la última validación (la que `pnpm build` escribió antes de construir), o null si todavía no hay una (p. ej.,
 * `pnpm dev` sin haber construido). La página /instrumento lo muestra; jamás lo calcula: validar es del build (RF-09.4).
 */
export function leerValidacion(dir = dirDatos()): Validacion | null {
  const ruta = join(dir, "instrumento", "validacion.json");
  return existsSync(ruta) ? (JSON.parse(readFileSync(ruta, "utf8")) as Validacion) : null;
}
