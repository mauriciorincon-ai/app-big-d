// CSP del export estático (D-S2-05 del S2; ADR `csp-static-export`). Next 16 no admite cabeceras ni nonces con
// `output: "export"`, y cada build cambia los scripts en línea (el payload de React lleva el build ID): las
// huellas no pueden vivir en `vercel.json`. Este paso corre DESPUÉS de `next build`, dentro de `pnpm build`
// (lo mismo en Vercel y en `pnpm start`): calcula la huella SHA-256 de cada `<script>` y `<style>` en línea de
// cada página del producto e inyecta `<meta http-equiv="Content-Security-Policy">` justo después de
// `<meta charSet>`, antes de cualquier script. Se niega a publicar una página con `style="…"` o un manejador
// `on…=` en línea (pedirían `'unsafe-hashes'`). La maqueta (`out/diseno/`) no pasa por aquí: lleva su propia CSP
// de cabecera, fija, en `vercel.json` y `serve.json`. Correrlo dos veces da los mismos bytes.
//
// Uso: node scripts/csp/inyectar.mjs [carpeta]   (por defecto, out/)
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHARSET = '<meta charSet="utf-8"/>';
const META = /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/g;
const SCRIPT_EN_LINEA = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const ESTILO_EN_LINEA = /<style[^>]*>([\s\S]*?)<\/style>/g;

const huella = (texto) => `'sha256-${createHash("sha256").update(texto, "utf8").digest("base64")}'`;
const unicas = (xs) => [...new Set(xs)].sort();

/**
 * La política de una página: lo propio del sitio y, en línea, solo lo que trae cada huella.
 * @param {{ scripts: string[], estilos: string[], conectar?: string[] }} p
 */
export function politica({ scripts, estilos, conectar = [] }) {
  return [
    "default-src 'self'",
    ["script-src 'self'", ...scripts].join(" "),
    ["style-src 'self'", ...estilos].join(" "),
    "img-src 'self' data:",
    "font-src 'self'",
    ["connect-src 'self'", ...conectar].join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * El HTML con su CSP. Lanza si la página trae lo que una CSP con huellas no puede permitir sin `unsafe-hashes`.
 * @param {string} html
 * @param {{ conectar?: string[], archivo?: string }} [opciones]
 * @returns {{ html: string, scripts: number, estilos: number }}
 */
export function conCSP(html, { conectar = [], archivo = "página" } = {}) {
  const limpio = html.replace(META, "");
  if (!limpio.includes(CHARSET)) throw new Error(`${archivo}: no trae ${CHARSET}; la CSP tiene que ir antes de cualquier script`);
  const sinCodigo = limpio.replace(SCRIPT_EN_LINEA, "").replace(ESTILO_EN_LINEA, "");
  const atributo = sinCodigo.match(/<[a-zA-Z][^>]*?\s(style|on[a-z]+)=/);
  if (atributo) throw new Error(`${archivo}: trae el atributo en línea «${atributo[1]}=»; muévelo a una clase o a un script`);
  const scripts = unicas([...limpio.matchAll(SCRIPT_EN_LINEA)].map((m) => huella(m[1])));
  const estilos = unicas([...limpio.matchAll(ESTILO_EN_LINEA)].map((m) => huella(m[1])));
  const meta = `<meta http-equiv="Content-Security-Policy" content="${politica({ scripts, estilos, conectar })}"/>`;
  return { html: limpio.replace(CHARSET, CHARSET + meta), scripts: scripts.length, estilos: estilos.length };
}

/**
 * El origen al que Sentry envía, si el build trae su DSN (connect-src); sin DSN, nada.
 * @param {string | undefined} [dsn]
 * @returns {string[]}
 */
export function origenSentry(dsn = process.env.NEXT_PUBLIC_SENTRY_DSN) {
  if (!dsn) return [];
  return [new URL(dsn).origin];
}

function paginas(dir) {
  return readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    if (statSync(ruta).isDirectory()) return f === "diseno" && dir === SALIDA ? [] : paginas(ruta);
    return f.endsWith(".html") ? [ruta] : [];
  });
}

const SALIDA = resolve(process.argv[2] ?? join(RAIZ, "out"));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const conectar = origenSentry();
  let s = 0;
  let e = 0;
  const lista = paginas(SALIDA);
  for (const ruta of lista) {
    const r = conCSP(readFileSync(ruta, "utf8"), { conectar, archivo: relative(RAIZ, ruta) });
    writeFileSync(ruta, r.html);
    s += r.scripts;
    e += r.estilos;
  }
  console.log(`csp: ${lista.length} páginas · ${s} huellas de script · ${e} de estilo${conectar.length ? ` · connect-src ${conectar.join(" ")}` : ""}`);
}
