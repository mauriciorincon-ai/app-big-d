// Escribe packages/diagramador/CONTRATO.lock desde la copia fijada. Se corre SOLO cuando la planeadora sube la
// versión del contrato. El lock fija el COMMIT de la planeadora del que sale la copia (D-S3-04, kit v1.39.0):
//   node scripts/contrato/fijar.mjs --origen <sha> --copiar   copia byte a byte desde el árbol de ese commit
//                                                             (`git show`, nunca un editor ni el HEAD) y fija
//   node scripts/contrato/fijar.mjs --origen <sha>            solo fija, y se niega si la copia no es la del commit
// Formato: `version: X.Y.Z`, `origen: <sha de 40>` y una línea `shasum -a 256` por archivo.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  DEL_CONTRATO,
  LOCK,
  PAQUETE,
  archivosDe,
  archivosEnCommit,
  bytesEnCommit,
  hayCommit,
  huellasDeLaCopia,
  relativoARaiz,
  sha256,
  sha256DeBytes,
  shaCompleto,
  versionDelContrato,
} from "./huellas.mjs";

const i = process.argv.indexOf("--origen");
const pedido = i > 0 ? process.argv[i + 1] : undefined;
if (!pedido) {
  console.error("fijar-contrato: falta --origen <sha del commit de la planeadora>");
  process.exit(1);
}
if (!hayCommit(pedido)) {
  console.error(`fijar-contrato: la planeadora no trae el commit ${pedido}`);
  process.exit(1);
}
const origen = shaCompleto(pedido);
const enCommit = archivosEnCommit(origen);

if (process.argv.includes("--copiar")) {
  for (const e of DEL_CONTRATO) rmSync(join(PAQUETE, e), { recursive: true, force: true });
  for (const r of enCommit) {
    mkdirSync(dirname(join(PAQUETE, r)), { recursive: true });
    writeFileSync(join(PAQUETE, r), bytesEnCommit(origen, r));
  }
  console.log(`fijar-contrato: ${enCommit.length} archivos copiados de ${origen.slice(0, 7)}`);
}

const enCopia = DEL_CONTRATO.flatMap((e) => archivosDe(PAQUETE, e)).map((r) => r.split("\\").join("/"));
const distintos = [
  ...enCommit.filter((r) => !enCopia.includes(r)).map((r) => `${r}: falta en la copia`),
  ...enCopia.filter((r) => !enCommit.includes(r)).map((r) => `${r}: no está en ${origen.slice(0, 7)}`),
  ...enCommit.filter((r) => enCopia.includes(r) && sha256(join(PAQUETE, r)) !== sha256DeBytes(bytesEnCommit(origen, r))).map((r) => `${r}: distinto del commit`),
];
if (distintos.length) {
  console.error(`✗ fijar-contrato: la copia no es la de ${origen.slice(0, 7)} (usa --copiar)\n  - ${distintos.join("\n  - ")}`);
  process.exit(1);
}

const huellas = huellasDeLaCopia();
const texto = [
  "# CONTRATO.lock — copia fijada del contrato del diagramador. NO se edita a mano:",
  "# `node scripts/contrato/fijar.mjs --origen <sha> --copiar` al renovar la copia; `node scripts/contrato/verificar.mjs`",
  "# la compara con reusables/diagramador/ de la planeadora EN ese commit; el gate `contrato-lock` la recalcula en cada test.",
  `version: ${versionDelContrato()}`,
  `origen: ${origen}`,
  ...huellas.map(([ruta, h]) => `${h}  ${ruta}`),
  "",
].join("\n");
writeFileSync(LOCK, texto);
console.log(`fijar-contrato: ${huellas.length} archivos, v${versionDelContrato()} de ${origen.slice(0, 7)} → ${relativoARaiz(LOCK)}`);
