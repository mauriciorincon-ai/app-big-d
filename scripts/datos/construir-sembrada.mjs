// Construye el sitio con la BASE SEMBRADA (D-S3-14): la base ficticia completa de la maqueta (cuatro plataformas, 44
// evidencias aprobadas, su instantánea y el caso aprobado) en .sembrada/datos, y el build con la perilla BIGD_DATOS
// hacia out-sembrada/. Lo usan las e2e de los estados que el dato real aún no tiene y la pasada de capturas. Jamás se
// publica: el build declara su árbol y Vercel rechaza la perilla. Uso: node scripts/datos/construir-sembrada.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const datos = join(RAIZ_REPO, ".sembrada/datos");
rmSync(join(RAIZ_REPO, ".sembrada"), { recursive: true, force: true });
mkdirSync(datos, { recursive: true });
const { armarBaseFuturo } = await cargarTs("tests/unit/lib/base-futuro.ts");
const version = armarBaseFuturo(datos, { atlas: true, raiz: RAIZ_REPO, segunda: true });
// M-6 (S8): un caso que SIEMPRE está en borrador (la copia del aprobado, como la deja «Duplicar»), para que las pruebas del editor
// del perfil (D7, comparar por pares) no dependan de que el dato real siga en borrador.
const { duplicarCaso } = await cargarTs("src/lib/caso/duplicar.ts");
duplicarCaso(datos, "hospital-futuro", "hospital-borrador");
console.log(`construir-sembrada: base sembrada en .sembrada/datos (instantánea ${version})`);
execFileSync("pnpm", ["build"], { cwd: RAIZ_REPO, stdio: "inherit", env: { ...process.env, BIGD_DATOS: datos, BIGD_FECHA_CONSULTA: "2026-09-26" } });
rmSync(join(RAIZ_REPO, "out-sembrada"), { recursive: true, force: true });
renameSync(join(RAIZ_REPO, "out"), join(RAIZ_REPO, "out-sembrada"));
console.log("construir-sembrada: sitio en out-sembrada/");
