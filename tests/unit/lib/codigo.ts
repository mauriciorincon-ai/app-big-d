import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Archivos de código bajo `raiz` con alguna de las extensiones (recursivo, sin node_modules). */
export function archivosDeCodigo(raiz: string, extensiones = [".ts", ".tsx", ".mjs", ".js"]): string[] {
  let st;
  try {
    st = statSync(raiz);
  } catch {
    return [];
  }
  if (st.isFile()) return extensiones.some((e) => raiz.endsWith(e)) ? [raiz] : [];
  return readdirSync(raiz)
    .filter((n) => n !== "node_modules")
    .flatMap((n) => archivosDeCodigo(join(raiz, n), extensiones));
}

export const leer = (ruta: string) => readFileSync(ruta, "utf8");
