// El perfil y el plan del repo, vueltos a BORRADOR sobre una carpeta `data/` temporal (S7, D-S7-02). Las pruebas de la
// aprobación necesitan un borrador pase lo que pase en el repo: cuando una persona apruebe el perfil y el plan reales, estas
// pruebas siguen verdes porque no dependen de en qué estado esté el dato del repo. Solo escriben donde se les dice.
// Se edita el TEXTO (no se reserializa), para conservar los comentarios de procedencia que el script de aprobación respeta.
import { existsSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Quita el aviso de «APROBADO», el sello (`aprobacion:` y lo que cuelga de él) y pone `estado_aprobacion: borrador`. */
function sinSello(texto: string): string {
  const salida: string[] = [];
  let enSello = false;
  for (const l of texto.split("\n")) {
    if (l.startsWith("# APROBADO") || l.startsWith("# No se edita a mano")) continue;
    if (/^aprobacion:/.test(l)) {
      enSello = true;
      continue;
    }
    if (enSello && /^\s/.test(l)) continue;
    enSello = false;
    salida.push(l.replace(/^estado_aprobacion: aprobado$/, "estado_aprobacion: borrador"));
  }
  return salida.join("\n");
}

/** Borra la revisión del caso y, si la carpeta queda vacía, la carpeta (un borrador de verdad no la tiene). */
function sinRevision(datos: string, tipo: "casos" | "planes", caso: string) {
  const dir = join(datos, "revisiones", tipo);
  rmSync(join(dir, `${caso}.jsonl`), { force: true });
  if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir);
}

const comoPropuesto = (texto: string) => texto.replace(/^(\s*)origen: declarado-por-usuario$/gm, "$1origen: propuesto-por-agente");

/** El plan del caso en `<datos>` como lo escribió el agente: sin sello, sin revisión, y cada número propuesto por el agente. */
export function planABorrador(datos: string, caso = "hospital-futuro") {
  const base = join(datos, "casos", caso, "plan");
  const cab = join(base, "plan.yaml");
  writeFileSync(cab, sinSello(readFileSync(cab, "utf8")));
  for (const carpeta of ["modos-de-falla", "supuestos"])
    for (const f of readdirSync(join(base, carpeta)).filter((x) => x.endsWith(".yaml"))) {
      const ruta = join(base, carpeta, f);
      writeFileSync(ruta, comoPropuesto(readFileSync(ruta, "utf8")));
    }
  sinRevision(datos, "planes", caso);
}

/** El perfil del caso en `<datos>` como lo escribió el agente: sin sello, sin revisión y con los pesos propuestos por el agente. */
export function casoABorrador(datos: string, caso = "hospital-futuro") {
  const ruta = join(datos, "casos", `${caso}.yaml`);
  if (!existsSync(ruta)) throw new Error(`no existe ${ruta}`);
  writeFileSync(ruta, comoPropuesto(sinSello(readFileSync(ruta, "utf8"))));
  sinRevision(datos, "casos", caso);
}
