// Compara la copia fijada con su ORIGEN: reusables/diagramador/ de la planeadora (solo lectura; ruta
// por DIAGRAMADOR_ORIGEN o la vecina por defecto) y la tabla de métricas de la maqueta. En CI la
// planeadora no existe: el script lo dice y sale en 0 (el gate `contrato-lock` cubre la copia contra
// su lock). `/cierre-sprint` hace la misma comparación desde la planeadora.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { DEL_CONTRATO, FUENTES_MAQUETA, RAIZ, archivosDe, huellasDeLaCopia, leerLock, sha256 } from "./huellas.mjs";

const ORIGEN = resolve(process.env.DIAGRAMADOR_ORIGEN ?? join(RAIZ, "../hr01-develop-ai-apps/reusables/diagramador"));
const { version, huellas: bloqueadas } = leerLock();
const fallas = [];

for (const [ruta, h] of huellasDeLaCopia()) {
  if (bloqueadas.get(ruta) !== h) fallas.push(`${ruta}: la copia no coincide con CONTRATO.lock`);
  const deContrato = DEL_CONTRATO.some((e) => ruta === e || ruta.startsWith(`${e}/`));
  const origen = deContrato ? join(ORIGEN, ruta) : join(FUENTES_MAQUETA, ruta.replace(/^metricas\//, ""));
  if (deContrato && !existsSync(ORIGEN)) continue;
  if (!existsSync(origen)) fallas.push(`${ruta}: no existe en el origen (${origen})`);
  else if (sha256(origen) !== h) fallas.push(`${ruta}: DERIVA contra el origen`);
}
// Y al revés (B-19 de la auditoría del S1): un archivo nuevo en el origen que la copia no trae también es deriva.
if (existsSync(ORIGEN)) {
  const enLaCopia = new Set(huellasDeLaCopia().map(([ruta]) => ruta));
  for (const e of DEL_CONTRATO)
    if (existsSync(join(ORIGEN, e)))
      for (const r of archivosDe(ORIGEN, e).map((x) => x.split("\\").join("/")))
        if (!enLaCopia.has(r)) fallas.push(`${r}: está en el origen y falta en la copia`);
}
if (!existsSync(ORIGEN)) console.log(`verificar-contrato: sin planeadora en ${ORIGEN}; solo se comparó la copia con su lock y con la maqueta`);
if (fallas.length) {
  console.error(`✗ verificar-contrato (v${version}): ${fallas.length} problema(s)\n  - ${fallas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ verificar-contrato: v${version}, ${bloqueadas.size} archivos idénticos a su origen`);
