// S10 (F3): la huella de la demo pública, versionada. Construye el paquete en una carpeta temporal con la fecha de consulta
// fija y escribe `tests/determinismo/DEMO.SHA256SUMS` (una línea `sha256  archivo` por archivo del paquete, y la huella del
// resultado del núcleo como `huella_inicial`). Un cambio en la demo cambia esas líneas a la vista de la revisión; el test
// tests/unit/demo/paquete.test.ts las compara con un build nuevo. Uso: node scripts/demo/huellas.mjs [--comprobar]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const FECHA_FIJA = "2026-11-12";
const RAIZ = join(fileURLToPath(import.meta.url), "../../..");
export const ARCHIVO = join(RAIZ, "tests/determinismo/DEMO.SHA256SUMS");

const lista = (d, base = d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? lista(join(d, f), base) : [relative(base, join(d, f))])).sort();

/** Las líneas de huellas de un paquete ya construido en `dir`. */
export function lineasDe(dir) {
  const m = JSON.parse(readFileSync(join(dir, "manifiesto.json"), "utf8"));
  const arch = lista(dir).map((f) => `${createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")}  ${f}`);
  return [`huella_inicial  ${m.huella_inicial}`, ...arch];
}

/** Construye el paquete en una carpeta temporal con la fecha fija y devuelve sus líneas. */
export function construirYHuellas() {
  const tmp = mkdtempSync(join(tmpdir(), "bigd-demo-huellas-"));
  try {
    execFileSync(process.execPath, [join(RAIZ, "scripts/demo/construir.mjs"), "--destino", tmp], { cwd: RAIZ, env: { ...process.env, BIGD_FECHA_CONSULTA: FECHA_FIJA }, stdio: "pipe" });
    return lineasDe(tmp);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const l = `${construirYHuellas().join("\n")}\n`;
  if (process.argv.includes("--comprobar")) {
    if (readFileSync(ARCHIVO, "utf8") !== l) {
      console.error("demo: DEMO.SHA256SUMS no es el de un build de hoy; corre `node scripts/demo/huellas.mjs` y revisa el diff");
      process.exit(1);
    }
    console.log("demo: DEMO.SHA256SUMS al día");
  } else {
    writeFileSync(ARCHIVO, l);
    console.log(`demo: ${ARCHIVO} escrito (${l.trim().split("\n").length} líneas)`);
  }
}
