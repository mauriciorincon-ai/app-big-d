// Regenera la PROPUESTA DE MUESTRA del kit de prueba (docs/kit-de-prueba/propuesta-de-muestra/) desde la misma
// muestra que usan las pruebas del investigador (tests/unit/investigador/lib/muestra.ts): la Plataforma Norte
// ficticia, sus páginas de fuente en disco (una sin la cita, otra casi sin texto) y la verificación de citas
// hecha por el código real (scripts/verificar-citas.mjs, espejo file://, fecha fija). B-26 de la auditoría del
// S1: el kit no tenía receta. `tests/unit/kit-de-prueba.test.ts` regenera en un temporal y compara byte a byte.
//
// Uso: node scripts/kit-de-prueba/generar.mjs [carpeta de salida]   (por defecto, la del kit)
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const SALIDA = resolve(process.argv[2] ?? join(RAIZ_REPO, "docs/kit-de-prueba/propuesta-de-muestra"));
process.chdir(RAIZ_REPO);
const m = await cargarTs("tests/unit/investigador/lib/muestra.ts");
const { raiz, carpeta, espejo } = m.raizDePrueba(m.propuestaNorte(), { sinCita: ["tablero"], corta: ["monitor-capacidad"] });
try {
  const v = spawnSync("node", ["scripts/verificar-citas.mjs", carpeta], {
    encoding: "utf8",
    env: { ...process.env, BIGD_RAIZ: raiz, BIGD_VERIFICAR_ESPEJO: espejo, BIGD_FECHA_CONSULTA: "2026-09-27" },
  });
  if (v.status !== 0) throw new Error(`verificar-citas: ${v.stderr}`);
  mkdirSync(join(SALIDA, carpeta), { recursive: true });
  mkdirSync(join(SALIDA, "data/plataformas"), { recursive: true });
  for (const f of ["propuesta.json", "verificacion.json"]) cpSync(join(raiz, carpeta, f), join(SALIDA, carpeta, f));
  cpSync(join(raiz, "data/plataformas", `${m.PLATAFORMA}.yaml`), join(SALIDA, "data/plataformas", `${m.PLATAFORMA}.yaml`));
  console.log(`kit-de-prueba: muestra regenerada en ${SALIDA} (${v.stdout.trim()})`);
} finally {
  rmSync(raiz, { recursive: true, force: true });
}
