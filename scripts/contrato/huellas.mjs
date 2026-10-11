// Huellas de la copia fijada del contrato del diagramador (packages/diagramador/). Un solo lugar
// define QUÉ archivos forman la copia: lo usan el script que escribe CONTRATO.lock, el que la compara
// con la planeadora y el gate `contrato-lock`.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PAQUETE = join(RAIZ, "packages/diagramador");
export const LOCK = join(PAQUETE, "CONTRATO.lock");
export const FUENTES_MAQUETA = join(RAIZ, "docs/diseno/assets/fuentes");
// La planeadora (solo lectura): el repo entero, porque el lock fija un COMMIT de origen y se lee el árbol de ese
// commit con git (D-S3-04; retro del S2: el contrato cambió a mitad del sprint y el HEAD dejó de ser el origen).
export const PLANEADORA = resolve(process.env.PLANEADORA ?? join(RAIZ, "../hr01-develop-ai-apps"));
export const OBJETO = "reusables/diagramador";

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
export const sha256DeBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** ¿Está la planeadora y trae ese commit? */
export function hayCommit(sha) {
  if (!existsSync(join(PLANEADORA, ".git"))) return false;
  try {
    execFileSync("git", ["-C", PLANEADORA, "cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** El sha completo de un commit de la planeadora (acepta uno corto). */
export const shaCompleto = (sha) => execFileSync("git", ["-C", PLANEADORA, "rev-parse", "--verify", `${sha}^{commit}`], { encoding: "utf8" }).trim();

/** Los archivos de la copia que vienen del contrato, tal como están en ese commit (rutas relativas a reusables/diagramador). */
export function archivosEnCommit(sha) {
  return execFileSync("git", ["-C", PLANEADORA, "ls-tree", "-r", "--name-only", sha, `${OBJETO}/`], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((r) => r.slice(OBJETO.length + 1))
    .filter((r) => DEL_CONTRATO.some((e) => r === e || r.startsWith(`${e}/`)))
    .sort(porUnidades);
}

/** Los bytes de un archivo del contrato en ese commit (Buffer: jamás utf8, un byte cuenta). */
export const bytesEnCommit = (sha, ruta) => execFileSync("git", ["-C", PLANEADORA, "show", `${sha}:${OBJETO}/${ruta}`], { maxBuffer: 64 * 1024 * 1024 });

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

/** Lee CONTRATO.lock: { version, origen, huellas: Map<ruta, sha256> }. `origen` = el commit de la planeadora copiado. */
export function leerLock(texto = readFileSync(LOCK, "utf8")) {
  let version = null;
  let origen = null;
  const huellas = new Map();
  for (const linea of texto.split("\n")) {
    if (!linea || linea.startsWith("#")) continue;
    const v = linea.match(/^version: ([0-9]+\.[0-9]+\.[0-9]+)$/);
    if (v) { version = v[1]; continue; }
    const o = linea.match(/^origen: ([0-9a-f]{40})$/);
    if (o) { origen = o[1]; continue; }
    const h = linea.match(/^([0-9a-f]{64}) {2}(.+)$/);
    if (!h) throw new Error(`CONTRATO.lock: línea con formato inválido: ${linea}`);
    huellas.set(h[2], h[1]);
  }
  return { version, origen, huellas };
}

export const relativoARaiz = (ruta) => relative(RAIZ, ruta);
