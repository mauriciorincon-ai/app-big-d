// Congela la base aprobada en data/instantaneas/<AAAA-MM-DD.N>.json (D-S3-13, RF-01.4). Es una DERIVACIÓN de lo que
// una persona ya aprobó, no una aprobación: no decide nada, solo calcula la huella (SHA-256 del JSON canónico,
// RFC 8785) del contenido aprobado y sus cambios frente a la instantánea anterior. La fecha es un argumento: nada
// lee el reloj. Antes de escribir, carga una copia de data/ con la instantánea nueva (el mismo cargador del build):
// si algo no pasa, no escribe nada. Si nada cambió desde la última, no congela otra.
//
// Uso: node scripts/instantanea.mjs AAAA-MM-DD
import { cpSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RAIZ } from "./investigar/raiz.mjs";
import { cargarTs } from "./lib/cargar-ts.mjs";

const CIVIL = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

try {
  const fecha = process.argv[2] ?? "";
  if (!CIVIL.test(fecha) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha) throw new Error(`la fecha va como argumento, AAAA-MM-DD (llegó «${fecha}»)`);
  const { cargarConocimiento } = await cargarTs("src/lib/datos/cargar-conocimiento.ts");
  const { nuevaInstantanea } = await cargarTs("src/lib/datos/instantanea.ts");
  const datos = join(RAIZ, "data");
  const k = cargarConocimiento(datos);
  const inst = nuevaInstantanea(k, fecha, k.instantaneas);
  const ultima = k.instantaneas.at(-1);
  if (ultima && ultima.huella === inst.huella) throw new Error(`nada cambió desde ${ultima.version}: no se congela otra`);
  if (!inst.contenido.evidencias.length) throw new Error("no hay evidencias aprobadas que congelar");
  const texto = `${JSON.stringify(inst, null, 2)}\n`;
  // Ensayo: la instantánea nueva sobre una copia de data/, cargada con el cargador del build.
  const ensayo = mkdtempSync(join(tmpdir(), "bigd-instantanea-"));
  try {
    cpSync(datos, join(ensayo, "data"), { recursive: true });
    mkdirSync(join(ensayo, "data/instantaneas"), { recursive: true });
    writeFileSync(join(ensayo, "data/instantaneas", `${inst.version}.json`), texto);
    cargarConocimiento(join(ensayo, "data"));
  } finally {
    rmSync(ensayo, { recursive: true, force: true });
  }
  mkdirSync(join(datos, "instantaneas"), { recursive: true });
  const ruta = join(datos, "instantaneas", `${inst.version}.json`);
  writeFileSync(`${ruta}.tmp`, texto);
  renameSync(`${ruta}.tmp`, ruta);
  console.log(`instantanea: ${inst.version} · ${inst.contenido.evidencias.length} evidencias aprobadas · ${inst.cambios.length} cambios frente a ${inst.anterior ?? "nada (es la primera)"} · sha256 ${inst.huella}`);
} catch (e) {
  console.error(`instantanea: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
