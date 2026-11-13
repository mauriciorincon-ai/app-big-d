// S10 (F2): `pnpm build:demo` — el paquete estático de la demo pública (anexo E4) en `out-demo/`, listo para que la sesión de
// CV Viva lo copie a `/piezas/big-d` por un PR de contenido (pregunta 2 a del G-Plan). Este repo NO escribe en hoja-de-vida.
//   es.html · en.html        las dos entradas, con su CSP por meta (huellas; ningún script en línea que se ejecute)
//   demo.js · demo-worker.js el cliente y el Worker, empaquetados con esbuild desde src/demo/ (el núcleo es el de la app)
//   (los datos del cliente —entrada, nombres y textos— viajan en cada HTML como bloque JSON: sin `fetch`, sin archivos aparte)
//   demo.css · fuentes/      la hoja (tokens + base + diagrama + atlas + demo) y los woff2 de G15 con su licencia OFL
//   manifiesto.json          la huella SHA-256 de cada archivo (sin sí mismo); dos builds dan los mismos bytes
// Las rutas son relativas: el paquete funciona bajo `/piezas/big-d/` (el `basePath` que declara el manifiesto) sin reescribir
// nada; tests/determinismo/demo.spec.ts lo sirve ahí y lo recorre en Chromium, Firefox y WebKit.
//
// Uso: node scripts/demo/construir.mjs [--destino <carpeta>]   (por defecto out-demo/)
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { build, transform } from "esbuild";
import { conCSP } from "../csp/inyectar.mjs";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

export const BASE_PATH = "/piezas/big-d";
export const ENTRADAS = ["es.html", "en.html"];
const i = process.argv.indexOf("--destino");
const DESTINO = resolve(RAIZ_REPO, i > 0 ? process.argv[i + 1] : "out-demo");
const HOJAS = ["src/styles/tokens.css", "src/styles/base.css", "src/styles/diagrama.css", "src/styles/atlas.css", "src/styles/demo.css"];
const FUENTES = ["space-grotesk.woff2", "jetbrains-mono.woff2", "OFL-space-grotesk.txt", "OFL-jetbrains-mono.txt"];

const sha = (b) => createHash("sha256").update(b).digest("hex");

async function empaquetar(entrada) {
  const r = await build({
    entryPoints: [join(RAIZ_REPO, entrada)],
    bundle: true,
    format: "iife",
    target: "es2020",
    platform: "browser",
    minify: true,
    legalComments: "none",
    charset: "utf8",
    write: false,
    logLevel: "silent",
    alias: { "@": join(RAIZ_REPO, "src") },
  });
  return r.outputFiles[0].text;
}

function archivos(dir, base = dir) {
  return readdirSync(dir)
    .flatMap((f) => (statSync(join(dir, f)).isDirectory() ? archivos(join(dir, f), base) : [relative(base, join(dir, f))]))
    .sort();
}

const { paqueteDemo } = await cargarTs("src/lib/demo/pagina.ts");
const p = await paqueteDemo();

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(join(DESTINO, "fuentes"), { recursive: true });
for (const [idioma, html] of Object.entries(p.paginas)) writeFileSync(join(DESTINO, `${idioma}.html`), conCSP(html, { archivo: `${idioma}.html` }).html);
writeFileSync(join(DESTINO, "demo.js"), await empaquetar("src/demo/cliente.ts"));
writeFileSync(join(DESTINO, "demo-worker.js"), await empaquetar("src/demo/worker.ts"));
// Minificada: sin comentarios (los de las hojas citan rutas del repo que no viajan).
const hoja = await transform(HOJAS.map((h) => readFileSync(join(RAIZ_REPO, h), "utf8")).join("\n"), { loader: "css", minify: true, legalComments: "none", charset: "utf8" });
writeFileSync(join(DESTINO, "demo.css"), hoja.code);
for (const f of FUENTES) copyFileSync(join(RAIZ_REPO, "docs/diseno/assets/fuentes", f), join(DESTINO, "fuentes", f));

const huellas = Object.fromEntries(archivos(DESTINO).map((f) => [f, sha(readFileSync(join(DESTINO, f)))]));
const manifiesto = { paquete: "big-d", basePath: BASE_PATH, entradas: ENTRADAS, fecha_consulta: p.fecha, huella_inicial: p.huellaInicial, archivos: huellas };
writeFileSync(join(DESTINO, "manifiesto.json"), `${JSON.stringify(manifiesto, null, 2)}\n`);
console.log(`demo: ${relative(RAIZ_REPO, DESTINO)}/ · ${Object.keys(huellas).length} archivos + manifiesto · basePath ${BASE_PATH} · huella inicial ${p.huellaInicial.slice(0, 12)}`);
