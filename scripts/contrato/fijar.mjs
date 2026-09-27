// Escribe packages/diagramador/CONTRATO.lock desde la copia fijada. Se corre SOLO cuando la
// planeadora sube la versión del contrato y la copia se renueva con `cp` (nunca con un editor: un
// formateador cambia bytes). Formato: `version: X.Y.Z` y una línea `shasum -a 256` por archivo.
import { writeFileSync } from "node:fs";
import { LOCK, huellasDeLaCopia, relativoARaiz, versionDelContrato } from "./huellas.mjs";

const huellas = huellasDeLaCopia();
const texto = [
  "# CONTRATO.lock — copia fijada del contrato del diagramador. NO se edita a mano:",
  "# `node scripts/contrato/fijar.mjs` tras renovar la copia; `node scripts/contrato/verificar.mjs` la",
  "# compara con reusables/diagramador/ de la planeadora; el gate `contrato-lock` la recalcula en cada test.",
  `version: ${versionDelContrato()}`,
  ...huellas.map(([ruta, h]) => `${h}  ${ruta}`),
  "",
].join("\n");
writeFileSync(LOCK, texto);
console.log(`fijar-contrato: ${huellas.length} archivos → ${relativoARaiz(LOCK)}`);
