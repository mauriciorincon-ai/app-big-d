// Utilidades comunes de los scripts del investigador: raíz de trabajo, lectura de datos y fecha.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";

/** Dónde viven data/ y propuestas/. Las pruebas la apuntan a una copia temporal con BIGD_RAIZ. */
export const RAIZ = resolve(process.env.BIGD_RAIZ ?? RAIZ_REPO);

export const leerYaml = (ruta) => parse(readFileSync(ruta, "utf8"));

/** La carpeta de una propuesta, siempre dentro de propuestas/. */
export function carpetaPropuesta(arg) {
  if (!arg) throw new Error("falta la carpeta de la propuesta (propuestas/<fecha>-<plataforma>…)");
  const dir = resolve(RAIZ, arg);
  if (!dir.startsWith(join(RAIZ, "propuestas") + "/")) throw new Error(`«${arg}» no está dentro de propuestas/`);
  if (!existsSync(join(dir, "propuesta.json"))) throw new Error(`no hay propuesta.json en ${arg}`);
  return dir;
}

/** Rangos de la fuente del diagrama (V15), de la copia fijada del contrato. */
export const rangos = () => JSON.parse(readFileSync(join(RAIZ_REPO, "packages/diagramador/metricas/cobertura.json"), "utf8")).fuentes["space-grotesk"].rangos;

export function gramaticaDe(mapa) {
  const id = mapa?.gramatica_id;
  const ruta = join(RAIZ, "data/gramaticas", `${id}.gramatica.yaml`);
  if (typeof id !== "string" || !existsSync(ruta)) throw new Error(`no existe la gramática «${id}» en data/gramaticas/`);
  return leerYaml(ruta);
}

/** Día de hoy (UTC) o el fijado para pruebas. */
export const hoy = (variable) => process.env[variable] || new Date().toISOString().slice(0, 10);
