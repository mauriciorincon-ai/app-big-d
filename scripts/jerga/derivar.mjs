// S9 (F1): deriva la tabla de cubos del detector de jerga (data/convenciones/jerga.yaml) de textos que el proyecto ya posee
// (vía d de decisions/jargon-detector.md: ninguna lista externa entra al repo sin licencia compatible, y la búsqueda de 20 min del
// 2026-11-11 no halló una sin ambigüedad). Las fuentes: los textos de la interfaz (src/lib/i18n), el manual de uso, y los textos
// {es, en} de los criterios, las capacidades, los casos y las convenciones. Se excluyen las plataformas y las evidencias (citan
// documentación del fabricante, que no es nuestra) y los términos de UNA palabra que la gramática o el glosario mandan explicar
// (son jerga a propósito; los de varias palabras se detectan por su frase, y sus palabras sueltas son comunes).
// Cuenta las apariciones de cada palabra y las reparte en cubos con `cuboDeCuenta` (el mismo código que usa el detector).
// Las `permitidas` no se derivan: se conservan del archivo (una persona las escribe); sin archivo, nacen de los nombres de las
// plataformas. Uso: node scripts/jerga/derivar.mjs [--comprobar]  (con --comprobar no escribe: sale ≠ 0 si el archivo difiere).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const IDIOMAS = ["es", "en"];
const DESTINO = join(RAIZ_REPO, "data/convenciones/jerga.yaml");
const { palabrasDe } = await cargarTs("src/engine/legibilidad.ts");
const { cuboDeCuenta, formaDePalabra } = await cargarTs("src/engine/jerga.ts");

const LARGO_MINIMO = 3;
const UMBRAL_CUBO = 4;

const yamls = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? yamls(join(d, e.name)) : e.name.endsWith(".yaml") ? [join(d, e.name)] : []));

/** Todo texto de un árbol YAML que cuelga de una clave `es` o `en`. */
function textosPorIdioma(nodo, idioma, out) {
  if (Array.isArray(nodo)) nodo.forEach((x) => textosPorIdioma(x, idioma, out));
  else if (nodo && typeof nodo === "object")
    for (const [k, v] of Object.entries(nodo)) {
      if (k === idioma) recoger(v, out);
      else textosPorIdioma(v, idioma, out);
    }
}
function recoger(v, out) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => recoger(x, out));
}

/** Los literales de cadena de un módulo de textos (sin los comentarios ni los identificadores del código). */
const literales = (ruta) => [...readFileSync(ruta, "utf8").matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => (m[1] ?? m[2]).replace(/\{[a-z_]+\}/gi, " "));

function manual(idioma) {
  const t = readFileSync(join(RAIZ_REPO, "docs/MANUAL-DE-USO.md"), "utf8");
  const [es, en] = t.split(/^## English$/m);
  const parte = idioma === "es" ? es.split(/^## Español$/m)[1] : en;
  return parte.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

const gramatica = parse(readFileSync(join(RAIZ_REPO, "data/gramaticas/plataformas-datos.gramatica.yaml"), "utf8"));
const informe = parse(readFileSync(join(RAIZ_REPO, "data/convenciones/informe.yaml"), "utf8"));

function derivar(idioma) {
  const textos = [...literales(join(RAIZ_REPO, `src/lib/i18n/${idioma}.ts`)), manual(idioma)];
  for (const carpeta of ["criterios", "capacidades", "casos"])
    for (const f of yamls(join(RAIZ_REPO, "data", carpeta))) textosPorIdioma(parse(readFileSync(f, "utf8")), idioma, textos);
  for (const f of ["informe", "entrevista"]) textosPorIdioma(parse(readFileSync(join(RAIZ_REPO, `data/convenciones/${f}.yaml`), "utf8")), idioma, textos);
  const excluidas = new Set(
    [...(gramatica.terminos_a_explicar?.[idioma] ?? []), ...informe.glosario.flatMap((g) => g.formas[idioma])].flatMap((x) => (palabrasDe(x).length === 1 ? [formaDePalabra(x)] : [])),
  );
  const cuenta = new Map();
  for (const t of textos)
    for (const p of palabrasDe(t)) {
      if (/^\d/.test(p)) continue;
      const w = formaDePalabra(p);
      if ([...w].length < LARGO_MINIMO || excluidas.has(w)) continue;
      cuenta.set(w, (cuenta.get(w) ?? 0) + 1);
    }
  return [...cuenta].map(([w, n]) => [w, cuboDeCuenta(n)]).filter(([, c]) => c <= UMBRAL_CUBO).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

function permitidas() {
  if (existsSync(DESTINO)) {
    const actual = parse(readFileSync(DESTINO, "utf8"));
    return actual.permitidas;
  }
  const dir = join(RAIZ_REPO, "data/plataformas");
  return Object.fromEntries(
    IDIOMAS.map((i) => [
      i,
      [...new Set(readdirSync(dir).filter((f) => f.endsWith(".yaml")).flatMap((f) => palabrasDe(parse(readFileSync(join(dir, f), "utf8")).nombre[i]).map(formaDePalabra)))].sort(),
    ]),
  );
}

const q = (s) => JSON.stringify(s);
const p = permitidas();
const cabecera = existsSync(DESTINO) ? parse(readFileSync(DESTINO, "utf8")).fuente : null;
const fuente = cabecera ?? {
  es: "Derivada con scripts/jerga/derivar.mjs de textos del propio proyecto (interfaz, manual, criterios, capacidades, casos y convenciones; licencia: la del proyecto, sin datos de terceros). La búsqueda de una lista externa con licencia MIT, Apache-2.0, CC0 o CC BY (20 min, 2026-11-11) no halló ninguna sin ambigüedad: decisions/jargon-detector.md.",
  en: "Derived with scripts/jerga/derivar.mjs from the project's own texts (interface, manual, criteria, capabilities, cases and conventions; license: the project's own, no third-party data). The search for an outside list under MIT, Apache-2.0, CC0 or CC BY (20 min, 2026-11-11) found none without ambiguity: decisions/jargon-detector.md.",
};
const salida = [
  "# S9 (F1): la tabla del detector de jerga (regla dura 11). `cubos` NO se edita a mano: se deriva con `node scripts/jerga/derivar.mjs`",
  "# (un test comprueba que este archivo es esa derivación). Solo se guardan las palabras comunes (cubo ≤ umbral_cubo); toda otra",
  "# palabra de más de largo_minimo letras es rara. `permitidas` sí la escribe una persona: nombres propios y términos aceptables.",
  "id: jerga",
  "fuente:",
  `  es: ${q(fuente.es)}`,
  `  en: ${q(fuente.en)}`,
  `largo_minimo: ${LARGO_MINIMO}`,
  `umbral_cubo: ${UMBRAL_CUBO}`,
  "cubos:",
  ...IDIOMAS.flatMap((i) => [`  ${i}:`, ...derivar(i).map(([w, c]) => `    ${q(w)}: ${c}`)]),
  "permitidas:",
  ...IDIOMAS.flatMap((i) => [`  ${i}:`, ...p[i].map((w) => `    - ${q(w)}`)]),
  "",
].join("\n");

if (process.argv.includes("--comprobar")) {
  if (!existsSync(DESTINO) || statSync(DESTINO).size === 0 || readFileSync(DESTINO, "utf8") !== salida) {
    console.error("data/convenciones/jerga.yaml no es la derivación de los textos del proyecto: corre `node scripts/jerga/derivar.mjs`.");
    process.exit(1);
  }
  console.log("jerga: la tabla es la derivación de los textos del proyecto");
} else {
  writeFileSync(DESTINO, salida);
  console.log(`jerga: ${DESTINO} escrito (${IDIOMAS.map((i) => `${i} ${derivar(i).length}`).join(" · ")} palabras comunes)`);
}
