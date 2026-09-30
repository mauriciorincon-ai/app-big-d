// Huellas de la copia fijada del contrato del diagramador (packages/diagramador/). Un solo lugar
// define QUÉ archivos forman la copia: lo usan el script que escribe CONTRATO.lock, el que la compara
// con la planeadora y el gate `contrato-lock`.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PAQUETE = join(RAIZ, "packages/diagramador");
export const LOCK = join(PAQUETE, "CONTRATO.lock");
export const FUENTES_MAQUETA = join(RAIZ, "docs/diseno/assets/fuentes");

// Documentos y carpetas que vienen de reusables/diagramador/ de la planeadora, byte a byte.
export const DEL_CONTRATO = ["CONTRATO.md", "CHANGELOG.md", "REGISTRO-DE-FALLAS.md", "README.md", "esquema", "gramaticas", "ejemplos", "carnadas"];
// La tabla de métricas y las fuentes vienen de la maqueta aprobada (G15): mismo archivo que sirve el sitio.
export const DE_LA_MAQUETA = ["metricas"];

const porUnidades = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function archivosDe(base, entrada) {
  const ruta = join(base, entrada);
  if (statSync(ruta).isFile()) return [entrada];
  return readdirSync(ruta)
    .flatMap((hijo) => archivosDe(base, join(entrada, hijo)))
    .sort(porUnidades);
}

export const sha256 = (ruta) => createHash("sha256").update(readFileSync(ruta)).digest("hex");

/** Lista ordenada de [ruta relativa al paquete, sha256] de toda la copia fijada. */
export function huellasDeLaCopia() {
  return [...DEL_CONTRATO, ...DE_LA_MAQUETA]
    .flatMap((e) => archivosDe(PAQUETE, e))
    .sort(porUnidades)
    .map((r) => [r.split("\\").join("/"), sha256(join(PAQUETE, r))]);
}

export function versionDelContrato() {
  const m = readFileSync(join(PAQUETE, "CONTRATO.md"), "utf8").match(/^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/m);
  if (!m) throw new Error("CONTRATO.md sin `version:` en el frontmatter");
  return m[1];
}

/** Lee CONTRATO.lock: { version, huellas: Map<ruta, sha256> }. */
export function leerLock(texto = readFileSync(LOCK, "utf8")) {
  let version = null;
  const huellas = new Map();
  for (const linea of texto.split("\n")) {
    if (!linea || linea.startsWith("#")) continue;
    const v = linea.match(/^version: ([0-9]+\.[0-9]+\.[0-9]+)$/);
    if (v) { version = v[1]; continue; }
    const h = linea.match(/^([0-9a-f]{64}) {2}(.+)$/);
    if (!h) throw new Error(`CONTRATO.lock: línea con formato inválido: ${linea}`);
    huellas.set(h[2], h[1]);
  }
  return { version, huellas };
}

export const relativoARaiz = (ruta) => relative(RAIZ, ruta);
