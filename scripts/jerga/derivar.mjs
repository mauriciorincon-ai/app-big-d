// S10 (F1): deriva la tabla de cubos del detector de jerga (data/convenciones/jerga.yaml) de Google Books Ngram (1-gramas, edición
// 20200217, español «spa» e inglés «eng», CC BY 3.0; decisions/jargon-detector.md, vía b). Se lee EN FLUJO (descarga → gunzip →
// línea): nada del crudo toca el disco ni el repo. `cubos` y `fuente` crecen de la frecuencia; los cubos se reparten por rango de
// frecuencia con `cuboDeRango` (el mismo código que usa el detector). Las `permitidas` no se derivan: se conservan del archivo
// (una persona las escribe) y son solo nombres propios.
//
//   node scripts/jerga/derivar.mjs              # descarga ≈ 8 GB en flujo (unos minutos) y escribe el yaml
//   node scripts/jerga/derivar.mjs --muestra    # deriva de la muestra fija tests/fixtures/ngram-muestra/ y la imprime (JSON)
//   node scripts/jerga/derivar.mjs --comprobar  # sin red: el yaml es una tabla bien formada y su huella es la de sus cubos
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";
import { acumuladorNuevo, acumular, curar, EDICION, IDIOMAS_NGRAM, leerIdioma, TOPE } from "./ngram.mjs";

const DESTINO = join(RAIZ_REPO, "data/convenciones/jerga.yaml");
const MUESTRA = join(RAIZ_REPO, "tests/fixtures/ngram-muestra");
const { cuboDeRango } = await cargarTs("src/engine/jerga.ts");
const IDIOMAS = ["es", "en"];
const LARGO_MINIMO = 3;
const UMBRAL_CUBO = 4;

/** palabras (de la más a la menos usada) → [[palabra, cubo]] en orden de unidades de código. */
const aTabla = (palabras) => palabras.map((w, i) => [w, cuboDeRango(i + 1)]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

/** La huella de la tabla: SHA-256 de sus cubos, en JSON canónico por idioma. Quien edite un cubo a mano rompe `--comprobar`. */
export const huellaDeCubos = (cubos) =>
  createHash("sha256")
    .update(JSON.stringify(IDIOMAS.map((i) => [i, Object.entries(cubos[i]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))])))
    .digest("hex");

const q = (s) => JSON.stringify(s);

/** El yaml guarda los cubos como una cadena de palabras por cubo (cargarlo es 20 veces más rápido que 24 000 claves); esto la abre. */
const abrirCubos = (porCubo) => Object.fromEntries(Object.entries(porCubo).flatMap(([c, palabras]) => (palabras ? palabras.split(" ").map((w) => [w, Number(c)]) : [])));

function permitidas() {
  return parse(readFileSync(DESTINO, "utf8")).permitidas;
}

const FUENTE = {
  es: `Derivada con scripts/jerga/derivar.mjs de la frecuencia de uso de Google Books Ngram · CC BY 3.0 (1-gramas en español, edición ${EDICION}, años 1990-2019; las ${TOPE} formas más usadas que pasan la curaduría, repartidas en cuatro cubos por rango). Atribución y licencia: LICENCIA-jerga.md. Nada del crudo se guarda; solo esta tabla. Vía (b) de decisions/jargon-detector.md.`,
  en: `Derived with scripts/jerga/derivar.mjs from the usage frequencies of Google Books Ngram · CC BY 3.0 (English 1-grams, edition ${EDICION}, years 1990-2019; the ${TOPE} most used forms that pass the curation, split into four buckets by rank). Attribution and license: LICENCIA-jerga.md. None of the raw data is kept; only this table. Route (b) of decisions/jargon-detector.md.`,
};

function yaml(cubosPorIdioma, perm) {
  const cubos = Object.fromEntries(IDIOMAS.map((i) => [i, Object.fromEntries(cubosPorIdioma[i])]));
  return [
    "# S10 (F1): la tabla del detector de jerga (regla dura 11). `cubos` NO se edita a mano: se deriva con `node scripts/jerga/derivar.mjs`",
    "# de Google Books Ngram (CC BY 3.0; atribución en LICENCIA-jerga.md). `huella` es el SHA-256 de los cubos: `--comprobar` la recalcula.",
    "# Toda palabra de más de largo_minimo letras que no esté aquí es rara. `permitidas` sí la escribe una persona: solo nombres propios.",
    "id: jerga",
    "fuente:",
    `  es: ${q(FUENTE.es)}`,
    `  en: ${q(FUENTE.en)}`,
    `edicion: ${q(EDICION)}`,
    `huella: ${q(huellaDeCubos(cubos))}`,
    `largo_minimo: ${LARGO_MINIMO}`,
    `umbral_cubo: ${UMBRAL_CUBO}`,
    "cubos:",
    ...IDIOMAS.flatMap((i) => [`  ${i}:`, ...[1, 2, 3, 4].map((c) => `    "${c}": ${q(cubosPorIdioma[i].filter(([, x]) => x === c).map(([w]) => w).join(" "))}`)]),
    "permitidas:",
    ...IDIOMAS.flatMap((i) => [`  ${i}:`, ...perm[i].map((w) => `    - ${q(w)}`)]),
    "",
  ].join("\n");
}

if (process.argv.includes("--comprobar")) {
  const actual = parse(readFileSync(DESTINO, "utf8"));
  const fallas = [];
  if (actual.edicion !== EDICION) fallas.push(`edicion ${actual.edicion} ≠ ${EDICION}`);
  if (!/Google Books Ngram · CC BY 3\.0/.test(actual.fuente?.es ?? "") || !/Google Books Ngram · CC BY 3\.0/.test(actual.fuente?.en ?? "")) fallas.push("la fuente no cita «Google Books Ngram · CC BY 3.0» en los dos idiomas");
  const abiertos = Object.fromEntries(IDIOMAS.map((i) => [i, abrirCubos(actual.cubos[i])]));
  if (actual.huella !== huellaDeCubos(abiertos)) fallas.push("la huella no es la de los cubos (¿se editó a mano?)");
  for (const i of IDIOMAS) {
    const n = Object.keys(abiertos[i]).length;
    if (n === 0 || n > TOPE) fallas.push(`${i}: ${n} formas (máximo ${TOPE})`);
  }
  if (fallas.length) {
    console.error(`data/convenciones/jerga.yaml no es la derivación de Ngram: ${fallas.join("; ")}. Corre \`node scripts/jerga/derivar.mjs\`.`);
    process.exit(1);
  }
  console.log(`jerga: la tabla es la derivación de Ngram ${EDICION} (huella ${actual.huella.slice(0, 12)})`);
} else if (process.argv.includes("--muestra")) {
  const salida = {};
  for (const i of IDIOMAS) {
    const cfg = IDIOMAS_NGRAM[i];
    const acum = acumuladorNuevo();
    for (const linea of readFileSync(join(MUESTRA, `${cfg.corpus}.tsv`), "utf8").split("\n")) if (linea) acumular(acum, linea, cfg);
    salida[i] = Object.fromEntries(aTabla(curar(acum, cfg)));
  }
  console.log(JSON.stringify(salida, null, 2));
} else {
  const perm = permitidas();
  const cubos = {};
  for (const i of IDIOMAS) {
    console.log(`▸ ${i}`);
    cubos[i] = aTabla(await leerIdioma(IDIOMAS_NGRAM[i], console.log));
  }
  writeFileSync(DESTINO, yaml(cubos, perm));
  console.log(`jerga: ${DESTINO} escrito (${IDIOMAS.map((i) => `${i} ${cubos[i].length}`).join(" · ")} formas)`);
}
