// S10 (F1): la fuente de la tabla de jerga, Google Books Ngram (1-gramas, edición 20200217, español «spa» e inglés «eng»),
// licencia CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/): solo exige atribución, que viaja en `data/convenciones/jerga.yaml`
// (campo `fuente`) y en LICENCIA-jerga.md. Los fragmentos pesan varios GB: se leen EN FLUJO (descarga → gunzip → línea) y de cada línea
// solo se guarda el conteo reciente (1990-2019) de las formas que pasan el alfabeto. Nada del crudo toca el disco ni el repo.
// (Misma edición y mismo flujo que usó Habla en su S8; aquí está reescrito: nada se copia entre repos.)
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export const EDICION = "20200217";
export const BASE = `https://storage.googleapis.com/books/ngrams/books/${EDICION}`;
/** Cuántas formas guarda la tabla por idioma (las más usadas que sobreviven a la curaduría). */
export const TOPE = 12_000;
const AÑO_DESDE = 1990;
/** Conteo mínimo (1990-2019) para guardar una forma: lo de abajo es OCR y rarezas, y no cabe en memoria. */
const PISO = 300;
/** Mayúscula inicial de la misma forma, para medir si es nombre propio. */
const RAZON_PROPIO = 4;

/** Palabras del OTRO idioma que abundan en el corpus y NO son palabras del idioma (si no, el inglés pasaría por llano en español). */
const AJENAS_ES = new Set(
  "the you and are not but have out get can just like yeah love good man hello please sorry yes baby boy girl god one two all her him his its dear why because people really maybe never right time here look going said been does done gone mom dad hey bye lady big old guy cool great nice very much more over again about house home life live give take make made let stop run help call tell talk say see mean need find leave put use way long little only some any other our your their them then than into from back off money father mother brother sister friend who what when where with was were has had this that these those for new now how also which".split(
    " ",
  ),
);
const AJENAS_EN = new Set(
  "dans avec pour und der die das ein est les des une qui que sur pas nicht ist von mit sich auf den dem zur aus nach bei sind wird auch eine ihre che per della non una del los las con por para como cum sunt quam ejus sed enim autem nam tamen ibid vol pdf isbn http www com org html bnt tbe ofthe andthe".split(
    " ",
  ),
);

export const IDIOMAS_NGRAM = {
  es: {
    codigo: "es",
    corpus: "spa",
    fragmentos: 3,
    /** Solo alfabeto español en minúscula, de 3 a 16 letras. */
    forma: /^[a-záéíóúüñ]{3,16}$/,
    /** Letras y grupos que el español no usa: casi siempre otro idioma, OCR o nombre propio del corpus. */
    marcadores: /[kw]|th|sh|ph|gh|ck|ss|ff|pp|tt|bb|dd|mm|zz|hh|hn|hm|(.)\1\1/,
    ajenas: AJENAS_ES,
    /** El español casi nunca termina en estas consonantes; los préstamos legítimos van en la lista blanca. */
    terminacionAjena: /[bcfgmptvx]$|h$/,
    prestamos: new Set(["club", "reloj", "internet", "robot", "álbum", "chip", "test", "ballet", "picnic", "fax", "chef", "golf", "film", "blog", "surf", "pop", "top", "set"]),
  },
  en: {
    codigo: "en",
    corpus: "eng",
    fragmentos: 24,
    forma: /^[a-z]{3,16}$/,
    marcadores: /[ñáéíóúü]|(.)\1\1|^[^aeiouy]{4,}$|[^aeiouy]{6,}|q(?!u)|^tbe$|^bnt$/,
    ajenas: AJENAS_EN,
    terminacionAjena: /$^/,
    prestamos: new Set(),
  },
};

const capital = (p) => p[0].toUpperCase() + p.slice(1);
const PLANO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,16}$/;

/** Suma los conteos de los años recientes de una línea `token\taño,conteo,volumenes\t…`. */
function conteoReciente(columnas) {
  let total = 0;
  for (let i = 1; i < columnas.length; i++) {
    const [anio, n] = columnas[i].split(",");
    if (Number(anio) >= AÑO_DESDE) total += Number(n);
  }
  return total;
}

/** Acumuladores vacíos de un idioma. */
export const acumuladorNuevo = () => ({ minusculas: new Map(), mayusculas: new Map() });

/** Una línea cruda de Ngram al acumulador (descarta etiquetas, símbolos, rarezas y lo que no es del alfabeto del idioma). */
export function acumular(acum, linea, cfg, piso = PISO) {
  const tab = linea.indexOf("\t");
  if (tab < 0) return;
  const token = linea.slice(0, tab);
  if (token.includes("_") || !PLANO.test(token)) return;
  const total = conteoReciente(linea.split("\t"));
  if (total < piso) return;
  // Copia plana: un `slice` de la línea la mantendría viva entera (≈ 7 KB por forma) y agotaría la memoria.
  const minus = Buffer.from(token.toLowerCase(), "utf8").toString("utf8");
  if (token === minus) {
    if (cfg.forma.test(minus)) acum.minusculas.set(minus, (acum.minusculas.get(minus) ?? 0) + total);
  } else if (token === capital(minus)) {
    acum.mayusculas.set(minus, (acum.mayusculas.get(minus) ?? 0) + total);
  }
}

/** La curaduría: las formas más usadas que sobreviven, de la más a la menos usada (empate: orden de unidades de código). */
export function curar(acum, cfg, tope = TOPE) {
  const ordenadas = [...acum.minusculas.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const palabras = [];
  for (const [palabra, conteo] of ordenadas) {
    if (palabras.length >= tope) break;
    if (cfg.marcadores.test(palabra) || cfg.ajenas.has(palabra)) continue;
    if (cfg.terminacionAjena.test(palabra) && !cfg.prestamos.has(palabra)) continue;
    // Nombre propio: la forma con mayúscula pesa varias veces más que la minúscula.
    if ((acum.mayusculas.get(palabra) ?? 0) > conteo * RAZON_PROPIO) continue;
    palabras.push(palabra);
  }
  return palabras;
}

/** Lee un fragmento remoto en flujo y entrega sus líneas. curl | gunzip: el gunzip de Node se detenía en silencio (multi-miembro). */
async function* lineasDeFragmento(url) {
  const hijo = spawn("sh", ["-c", `curl -sf --retry 3 "${url}" | gunzip`], { stdio: ["ignore", "pipe", "inherit"] });
  const cerrado = new Promise((ok, mal) => hijo.on("close", (code) => (code === 0 ? ok() : mal(new Error(`curl|gunzip salió con ${code}: ${url}`)))));
  for await (const linea of createInterface({ input: hijo.stdout, crlfDelay: Infinity })) yield linea;
  await cerrado;
}

/** Todo un idioma desde la red, en flujo: devuelve las palabras curadas por frecuencia. */
export async function leerIdioma(cfg, registro = () => {}) {
  const acum = acumuladorNuevo();
  for (let k = 0; k < cfg.fragmentos; k++) {
    const num = (n) => String(n).padStart(5, "0");
    const url = `${BASE}/${cfg.corpus}/1-${num(k)}-of-${num(cfg.fragmentos)}.gz`;
    for await (const linea of lineasDeFragmento(url)) acumular(acum, linea, cfg);
    registro(`  ${cfg.corpus} ${k + 1}/${cfg.fragmentos} (${acum.minusculas.size} formas)`);
  }
  return curar(acum, cfg);
}
