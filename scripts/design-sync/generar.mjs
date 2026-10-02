// Escribe el bundle de design-sync/ (styles.css y components/) desde scripts/design-sync/bundle.ts, y borra las
// tarjetas que ya no genera. README.md y project.json no se tocan: el primero se escribe a mano y el segundo lo
// actualiza /design-sync al publicar. Uso: node scripts/design-sync/generar.mjs
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const DIR = join(RAIZ_REPO, "design-sync");
process.chdir(RAIZ_REPO);
const { bundle } = await cargarTs("scripts/design-sync/bundle.ts");
const archivos = bundle();
const listar = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? listar(join(d, n)) : [join(d, n)]));
mkdirSync(join(DIR, "components"), { recursive: true });
for (const viejo of listar(join(DIR, "components"))) if (!(relative(DIR, viejo) in archivos)) rmSync(viejo);
for (const [ruta, contenido] of Object.entries(archivos)) {
  mkdirSync(dirname(join(DIR, ruta)), { recursive: true });
  writeFileSync(join(DIR, ruta), contenido);
}
console.log(`design-sync: ${Object.keys(archivos).length} archivos (${Object.keys(archivos).join(" · ")})`);
