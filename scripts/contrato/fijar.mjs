// Escribe el CONTRATO.lock de una copia fijada (packages/<objeto>/) desde la copia. Se corre SOLO cuando la planeadora
// sube la versión del contrato. El lock fija el COMMIT de la planeadora del que sale la copia (D-S3-04, kit v1.39.0):
//   node scripts/contrato/fijar.mjs --origen <sha> --copiar   copia byte a byte desde el árbol de ese commit
//                                                             (`git show`, nunca un editor ni el HEAD) y fija
//   node scripts/contrato/fijar.mjs --origen <sha>            solo fija, y se niega si la copia no es la del commit
// `--objeto <nombre>` elige el reusable (por omisión, el diagramador; también `instrumentos-de-plan`, S5). Un objeto con
// implementación congelada (copiada de otra app) la recibe una vez a mano y `--copia-de "app-planlang@<sha>"` deja el
// rastro en el encabezado del lock. Formato: `version: X.Y.Z`, `origen: <sha de 40>` y una línea `shasum -a 256` por archivo.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  archivosDe,
  archivosEnCommit,
  bytesEnCommit,
  hayCommit,
  huellasDeLaCopia,
  objetoDeArgumentos,
  relativoARaiz,
  sha256,
  sha256DeBytes,
  shaCompleto,
  versionDelContrato,
} from "./huellas.mjs";

const o = objetoDeArgumentos();
const opcion = (nombre) => {
  const i = process.argv.indexOf(nombre);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const pedido = opcion("--origen");
if (!pedido) {
  console.error("fijar-contrato: falta --origen <sha del commit de la planeadora>");
  process.exit(1);
}
if (!hayCommit(pedido)) {
  console.error(`fijar-contrato: la planeadora no trae el commit ${pedido}`);
  process.exit(1);
}
const origen = shaCompleto(pedido);
const enCommit = archivosEnCommit(origen, o);

if (process.argv.includes("--copiar")) {
  for (const e of o.delContrato) rmSync(join(o.paquete, e), { recursive: true, force: true });
  for (const r of enCommit) {
    mkdirSync(dirname(join(o.paquete, r)), { recursive: true });
    writeFileSync(join(o.paquete, r), bytesEnCommit(origen, r, o));
  }
  console.log(`fijar-contrato: ${enCommit.length} archivos copiados de ${origen.slice(0, 7)}`);
}

const enCopia = o.delContrato.flatMap((e) => archivosDe(o.paquete, e)).map((r) => r.split("\\").join("/"));
const distintos = [
  ...enCommit.filter((r) => !enCopia.includes(r)).map((r) => `${r}: falta en la copia`),
  ...enCopia.filter((r) => !enCommit.includes(r)).map((r) => `${r}: no está en ${origen.slice(0, 7)}`),
  ...enCommit.filter((r) => enCopia.includes(r) && sha256(join(o.paquete, r)) !== sha256DeBytes(bytesEnCommit(origen, r, o))).map((r) => `${r}: distinto del commit`),
];
if (distintos.length) {
  console.error(`✗ fijar-contrato: la copia no es la de ${origen.slice(0, 7)} (usa --copiar)\n  - ${distintos.join("\n  - ")}`);
  process.exit(1);
}

const huellas = huellasDeLaCopia(o);
const copiaDe = opcion("--copia-de");
const texto = [
  `# CONTRATO.lock — copia fijada de reusables/${o.nombre}. NO se edita a mano:`,
  `# \`node scripts/contrato/fijar.mjs --objeto ${o.nombre} --origen <sha> --copiar\` al renovar la copia; \`node scripts/contrato/verificar.mjs --objeto ${o.nombre}\``,
  `# la compara con ${o.objeto}/ de la planeadora EN ese commit; el gate \`contrato-lock\` la recalcula en cada test.`,
  ...(copiaDe ? [`# copia de: ${copiaDe} (implementación congelada: ningún byte se edita después de copiada)`] : []),
  `version: ${versionDelContrato(o)}`,
  `origen: ${origen}`,
  ...huellas.map(([ruta, h]) => `${h}  ${ruta}`),
  "",
].join("\n");
writeFileSync(o.lock, texto);
console.log(`fijar-contrato: ${huellas.length} archivos, v${versionDelContrato(o)} de ${origen.slice(0, 7)} → ${relativoARaiz(o.lock)}`);
