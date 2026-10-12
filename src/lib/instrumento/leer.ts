import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Validacion } from "@/engine";
import { dirDatos } from "@/lib/datos/dir";

const bilingue = z.strictObject({ es: z.string(), en: z.string() });
const fila = z.strictObject({ id: z.string().min(1), descripcion: bilingue, ok: z.boolean(), detalle: bilingue });

/**
 * La forma del archivo que escribe `scripts/instrumento/validar.mjs` (S4-M7): la página no lo toma por bueno con un cast. Un
 * archivo de otra versión o con un campo roto falla al leerlo, con la ruta del campo, y no se pinta a medias.
 */
export const esquemaValidacion = z.strictObject({
  version: z.literal(1),
  base: z.strictObject({ casos: z.array(z.string()), instantaneas: z.array(z.string()), evidencias: z.number().int().min(0) }),
  referencias: z.array(fila),
  propiedades: z.array(fila.extend({ corridas: z.number().int().min(1), semilla: z.number().int().min(0) })),
  sembrados: z.array(fila),
  aprobaciones: z.array(fila),
  huellaNucleo: z.string().nullable(),
});

/**
 * El resultado de la última validación (la que `pnpm build` escribió antes de construir), o null si todavía no hay una (p. ej.,
 * `pnpm dev` sin haber construido). La página /instrumento lo muestra; jamás lo calcula: validar es del build (RF-09.4).
 */
export function leerValidacion(dir = dirDatos()): Validacion | null {
  const ruta = join(dir, "instrumento", "validacion.json");
  if (!existsSync(ruta)) return null;
  const v = esquemaValidacion.safeParse(JSON.parse(readFileSync(ruta, "utf8")));
  if (!v.success) throw new Error(`${ruta} · ${v.error.issues.map((i) => `${i.path.join(".") || "/"} · ${i.message}`).join(" · ")}`);
  return v.data as Validacion;
}
