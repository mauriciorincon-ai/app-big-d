// Lo que se escribe al aprobar el perfil o el plan de un caso: un solo lugar para el script de aprobación (que solo corre una
// persona) y para el ensayo en una copia (`scripts/datos/copia-aprobada.mjs`, S7). Son funciones de escritura: no deciden nada,
// reciben el caso o el plan ya aprobados por `aprobarCaso` / `aprobarPlan` (src/lib/investigador/) y los ponen en disco.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";

/** Escribe entero o no escribe: temporal al lado y `rename` (atómico en el mismo disco). */
export function escribirEntero(ruta, texto) {
  writeFileSync(`${ruta}.tmp`, texto);
  renameSync(`${ruta}.tmp`, ruta);
}

const yaml = (d) => stringify(d, { lineWidth: 0, version: "1.2" });

/**
 * El perfil aprobado, entero a un temporal y renombrado, y la línea de la revisión al final (B-34: entero o nada).
 * `alCortar` es la costura de las pruebas (S4-B3): se llama entre la revisión y el archivo aprobado.
 */
export function escribirCaso(raiz, caso, revision, desdeBorrador, { alCortar = () => {}, procedencia = "scripts/aprobar.mjs --caso" } = {}) {
  const cabecera = `# APROBADO por una persona el ${revision.fecha} (UTC) con ${procedencia} (sobre el borrador ${desdeBorrador.slice(0, 12)}…).\n# No se edita a mano: su huella y la de su revisión (data/revisiones/casos/${caso.id}.jsonl) deben coincidir; para cambiarlo se aprueba otro borrador.\n`;
  // S4-B3: la revisión va PRIMERO y el perfil al final, que es el punto de compromiso. Un corte entre las dos escrituras
  // deja una línea de revisión sin perfil aprobado (inocua, la base carga) y no un perfil `aprobado` sin su revisión
  // (que el cargador rechaza como editado a mano).
  mkdirSync(join(raiz, "data/revisiones/casos"), { recursive: true });
  const rutaRev = join(raiz, "data/revisiones/casos", `${caso.id}.jsonl`);
  escribirEntero(rutaRev, `${existsSync(rutaRev) ? readFileSync(rutaRev, "utf8") : ""}${JSON.stringify(revision)}\n`);
  alCortar();
  escribirEntero(join(raiz, "data/casos", `${caso.id}.yaml`), cabecera + yaml(caso));
}

/**
 * El plan aprobado, archivo por archivo (cada uno entero a un temporal y renombrado) y la línea de la revisión al final.
 * `plan.yaml` conserva sus comentarios de procedencia; los riesgos y los supuestos se reescriben con su nuevo origen.
 */
export function escribirPlan(raiz, plan, revision, desdeBorrador, { alCortar = () => {}, procedencia = "scripts/aprobar.mjs --plan" } = {}) {
  const base = join(raiz, "data/casos", plan.caso_id, "plan");
  const rutaCab = join(base, "plan.yaml");
  const previos = (existsSync(rutaCab) ? readFileSync(rutaCab, "utf8").split("\n") : []).filter((l) => l.startsWith("#") && !l.startsWith("# APROBADO") && !l.startsWith("# No se edita a mano"));
  const aviso = `# APROBADO por una persona el ${revision.fecha} (UTC) con ${procedencia} (sobre el borrador ${desdeBorrador.slice(0, 12)}…): sus riesgos y sus supuestos quedan declarado-por-usuario.\n# No se edita a mano: su huella y la de su revisión (data/revisiones/planes/${plan.caso_id}.jsonl) deben coincidir; para cambiarlo se aprueba otro borrador.\n`;
  for (const m of plan.modos_de_falla) escribirEntero(join(base, "modos-de-falla", `${m.id}.yaml`), yaml(m));
  for (const s of plan.supuestos) escribirEntero(join(base, "supuestos", `${s.id}.yaml`), yaml(s));
  // S4-B3: igual que el perfil, `plan.yaml` (el que dice «aprobado») se escribe al final, después de la revisión.
  mkdirSync(join(raiz, "data/revisiones/planes"), { recursive: true });
  const rutaRev = join(raiz, "data/revisiones/planes", `${plan.caso_id}.jsonl`);
  escribirEntero(rutaRev, `${existsSync(rutaRev) ? readFileSync(rutaRev, "utf8") : ""}${JSON.stringify(revision)}\n`);
  alCortar();
  escribirEntero(rutaCab, `${aviso}${previos.join("\n")}${previos.length ? "\n" : ""}${yaml({ caso_id: plan.caso_id, estado_aprobacion: plan.estado_aprobacion, aprobacion: plan.aprobacion })}`);
}
