// Huellas de la copia fijada del contrato del diagramador (packages/diagramador/). Un solo lugar
// define QUÉ archivos forman la copia: lo usan el script que escribe CONTRATO.lock, el que la compara
// con la planeadora y el gate `contrato-lock`.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const FUENTES_MAQUETA = join(RAIZ, "docs/diseno/assets/fuentes");
// La planeadora (solo lectura): el repo entero, porque el lock fija un COMMIT de origen y se lee el árbol de ese
// commit con git (D-S3-04; retro del S2: el contrato cambió a mitad del sprint y el HEAD dejó de ser el origen).
export const PLANEADORA = resolve(process.env.PLANEADORA ?? join(RAIZ, "../hr01-develop-ai-apps"));

// Un reusable de la casa copiado a packages/<nombre>/ con su CONTRATO.lock. Cada objeto dice qué archivos de la copia
// vienen del contrato (se comparan byte a byte con reusables/<nombre>/ de la planeadora EN el commit `origen`), cuáles
// vienen de la maqueta aprobada y cuáles son una implementación CONGELADA (copiada de otra app, sin original en la
// planeadora: el lock solo garantiza que nadie la edita después).
const delContratoIdentidad = (r, lista) => (lista.some((e) => r === e || r.startsWith(`${e}/`)) ? r : null);
export const OBJETOS = {
  diagramador: {
    nombre: "diagramador",
    paquete: join(RAIZ, "packages/diagramador"),
    objeto: "reusables/diagramador",
    contratoMd: "CONTRATO.md",
    delContrato: ["CONTRATO.md", "CHANGELOG.md", "REGISTRO-DE-FALLAS.md", "README.md", "esquema", "gramaticas", "ejemplos", "carnadas"],
    // La tabla de métricas y las fuentes vienen de la maqueta aprobada (G15): mismo archivo que sirve el sitio.
    deLaMaqueta: ["metricas"],
    congelados: [],
    // Ruta de la planeadora (relativa al objeto) → ruta en la copia, o null si esa copia no la lleva.
    desdePlaneadora: (r) => delContratoIdentidad(r, OBJETOS.diagramador.delContrato),
    aPlaneadora: (r) => r,
  },
  "instrumentos-de-plan": {
    nombre: "instrumentos-de-plan",
    paquete: join(RAIZ, "packages/instrumentos-de-plan"),
    objeto: "reusables/instrumentos-de-plan",
    contratoMd: "contrato/CONTRATO.md",
    delContrato: ["contrato/CONTRATO.md"],
    deLaMaqueta: [],
    // La implementación sale de app-planlang (solo lectura, `# copia de:` en el lock): no tiene original en la planeadora.
    congelados: ["README.md", "carnadas", "datos", "src", "tests"],
    desdePlaneadora: (r) => (r === "CONTRATO.md" ? "contrato/CONTRATO.md" : null),
    aPlaneadora: (r) => (r === "contrato/CONTRATO.md" ? "CONTRATO.md" : null),
  },
};
export const objetoDe = (nombre = "diagramador") => {
  const o = OBJETOS[nombre];
  if (!o) throw new Error(`objeto de contrato desconocido: ${nombre} (${Object.keys(OBJETOS).join(", ")})`);
  return { ...o, lock: join(o.paquete, "CONTRATO.lock") };
};
/** El objeto que pide `--objeto <nombre>` en la línea de comandos (por omisión, el diagramador). */
export const objetoDeArgumentos = (argv = process.argv) => {
  const i = argv.indexOf("--objeto");
  return objetoDe(i > 0 ? argv[i + 1] : undefined);
};
// Compatibilidad: lo que ya importaban los scripts y el gate del diagramador.
export const PAQUETE = OBJETOS.diagramador.paquete;
export const LOCK = join(PAQUETE, "CONTRATO.lock");
export const OBJETO = OBJETOS.diagramador.objeto;
export const DEL_CONTRATO = OBJETOS.diagramador.delContrato;
export const DE_LA_MAQUETA = OBJETOS.diagramador.deLaMaqueta;

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

/** Los archivos de la copia que vienen del contrato, tal como están en ese commit (rutas relativas al paquete). */
export function archivosEnCommit(sha, o = objetoDe()) {
  return execFileSync("git", ["-C", PLANEADORA, "ls-tree", "-r", "--name-only", sha, `${o.objeto}/`], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((r) => o.desdePlaneadora(r.slice(o.objeto.length + 1)))
    .filter(Boolean)
    .sort(porUnidades);
}

/** Los bytes de un archivo del contrato en ese commit (Buffer: jamás utf8, un byte cuenta). `ruta` es la de la copia. */
export const bytesEnCommit = (sha, ruta, o = objetoDe()) =>
  execFileSync("git", ["-C", PLANEADORA, "show", `${sha}:${o.objeto}/${o.aPlaneadora(ruta)}`], { maxBuffer: 64 * 1024 * 1024 });

/** ¿Esta ruta de la copia viene del contrato (y por lo tanto se compara con la planeadora)? */
export const esDelContrato = (ruta, o = objetoDe()) => o.delContrato.some((e) => ruta === e || ruta.startsWith(`${e}/`));

/** Lista ordenada de [ruta relativa al paquete, sha256] de toda la copia fijada. */
export function huellasDeLaCopia(o = objetoDe()) {
  return [...o.delContrato, ...o.deLaMaqueta, ...o.congelados]
    .flatMap((e) => archivosDe(o.paquete, e))
    .sort(porUnidades)
    .map((r) => [r.split("\\").join("/"), sha256(join(o.paquete, r))]);
}

export function versionDelContrato(o = objetoDe()) {
  const m = readFileSync(join(o.paquete, o.contratoMd), "utf8").match(/^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/m);
  if (!m) throw new Error(`${o.contratoMd} sin \`version:\` en el frontmatter`);
  return m[1];
}

/** Lee CONTRATO.lock: { version, origen, huellas: Map<ruta, sha256> }. `origen` = el commit de la planeadora copiado. */
export function leerLock(texto, o = objetoDe()) {
  texto ??= readFileSync(o.lock, "utf8");
  let version = null;
  let origen = null;
  const huellas = new Map();
  for (const linea of texto.split("\n")) {
    if (!linea || linea.startsWith("#")) continue;
    const v = linea.match(/^version: ([0-9]+\.[0-9]+\.[0-9]+)$/);
    if (v) { version = v[1]; continue; }
    const org = linea.match(/^origen: ([0-9a-f]{40})$/);
    if (org) { origen = org[1]; continue; }
    const h = linea.match(/^([0-9a-f]{64}) {2}(.+)$/);
    if (!h) throw new Error(`CONTRATO.lock: línea con formato inválido: ${linea}`);
    huellas.set(h[2], h[1]);
  }
  return { version, origen, huellas };
}

export const relativoARaiz = (ruta) => relative(RAIZ, ruta);
