// La raíz del repo y la de trabajo, sin dependencias: los hooks la importan y no pueden depender de esbuild
// (B-29 de la auditoría del S1: si esbuild no cargaba, el hook fallaba ABIERTO y Claude Code seguía).
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Dónde viven data/ y propuestas/. Las pruebas la apuntan a una copia temporal con BIGD_RAIZ. */
export const RAIZ = resolve(process.env.BIGD_RAIZ ?? RAIZ_REPO);
