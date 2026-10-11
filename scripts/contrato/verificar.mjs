// Compara la copia fijada con su ORIGEN: reusables/diagramador/ de la planeadora EN EL COMMIT que fija el lock
// (`origen:`, D-S3-04) y la tabla de métricas de la maqueta. La deriva frente al HEAD de la planeadora no es falla:
// se informa (la casa puede publicar una versión nueva durante el sprint; retro del S2). En CI la planeadora no existe:
// el script lo dice y sale en 0 (el gate `contrato-lock` cubre la copia contra su lock). `/cierre-sprint` 2-ter hace la
// misma comparación desde la planeadora (`git show <origen>:reusables/diagramador/<archivo> | shasum -a 256`).
// Ruta de la planeadora: PLANEADORA o la vecina por defecto.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DEL_CONTRATO,
  FUENTES_MAQUETA,
  OBJETO,
  PLANEADORA,
  archivosEnCommit,
  bytesEnCommit,
  hayCommit,
  huellasDeLaCopia,
  leerLock,
  sha256,
  sha256DeBytes,
} from "./huellas.mjs";

const { version, origen, huellas: bloqueadas } = leerLock();
const fallas = [];
if (!origen) fallas.push("CONTRATO.lock sin `origen:` (el commit de la planeadora del que sale la copia)");
const conPlaneadora = origen !== null && hayCommit(origen);
const copia = huellasDeLaCopia();

for (const [ruta, h] of copia) {
  if (bloqueadas.get(ruta) !== h) fallas.push(`${ruta}: la copia no coincide con CONTRATO.lock`);
  const deContrato = DEL_CONTRATO.some((e) => ruta === e || ruta.startsWith(`${e}/`));
  if (!deContrato) {
    const maqueta = join(FUENTES_MAQUETA, ruta.replace(/^metricas\//, ""));
    if (!existsSync(maqueta)) fallas.push(`${ruta}: no existe en la maqueta (${maqueta})`);
    else if (sha256(maqueta) !== h) fallas.push(`${ruta}: DERIVA contra la maqueta`);
  }
}
let enHead = null;
if (conPlaneadora) {
  const enCommit = archivosEnCommit(origen);
  const enCopia = new Set(copia.map(([r]) => r));
  for (const r of enCommit) {
    if (!enCopia.has(r)) fallas.push(`${r}: está en ${origen.slice(0, 7)} y falta en la copia`);
    else if (sha256DeBytes(bytesEnCommit(origen, r)) !== copia.find(([x]) => x === r)[1]) fallas.push(`${r}: DERIVA contra ${origen.slice(0, 7)}`);
  }
  for (const [r] of copia)
    if (DEL_CONTRATO.some((e) => r === e || r.startsWith(`${e}/`)) && !enCommit.includes(r)) fallas.push(`${r}: no está en ${origen.slice(0, 7)}`);
  // Informativo: ¿la planeadora publicó otra versión después del origen?
  const head = execFileSync("git", ["-C", PLANEADORA, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const cambiados = execFileSync("git", ["-C", PLANEADORA, "diff", "--name-only", origen, head, "--", `${OBJETO}/`], { encoding: "utf8" }).split("\n").filter(Boolean);
  enHead = { head, cambiados };
} else if (origen) {
  console.log(`verificar-contrato: sin la planeadora (o sin el commit ${origen.slice(0, 7)}) en ${PLANEADORA}; solo se comparó la copia con su lock y con la maqueta`);
}
if (fallas.length) {
  console.error(`✗ verificar-contrato (v${version}): ${fallas.length} problema(s)\n  - ${fallas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ verificar-contrato: v${version}, ${bloqueadas.size} archivos idénticos a su origen${conPlaneadora ? ` (${origen.slice(0, 7)})` : ""}`);
if (enHead?.cambiados.length) console.log(`  deriva esperada frente al HEAD de la planeadora (${enHead.head.slice(0, 7)}): ${enHead.cambiados.length} archivo(s) de ${OBJETO} cambiaron después del origen; se renuevan en el sprint que adopte esa versión`);
else if (enHead) console.log(`  el HEAD de la planeadora (${enHead.head.slice(0, 7)}) no cambió ${OBJETO} desde el origen`);
