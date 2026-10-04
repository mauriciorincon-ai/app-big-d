// CSP del export estático (D-S2-05 del S2; ADR `csp-static-export`). Next 16 no admite cabeceras ni nonces con
// `output: "export"`, y cada build cambia los scripts en línea (el payload de React lleva el build ID): las
// huellas no pueden vivir en `vercel.json`. Este paso corre DESPUÉS de `next build`, dentro de `pnpm build`
// (lo mismo en Vercel y en `pnpm start`): calcula la huella SHA-256 de cada `<script>` y `<style>` en línea de
// cada página del producto e inyecta `<meta http-equiv="Content-Security-Policy">` justo después de
// `<meta charSet>`, antes de cualquier script. Se niega a publicar una página con `style="…"` o un manejador
// `on…=` en línea (pedirían `'unsafe-hashes'`). La maqueta (`out/diseno/`) no pasa por aquí: lleva su propia CSP
// de cabecera, fija, en `vercel.json` y `serve.json`. Correrlo dos veces da los mismos bytes.
// Los estilos en línea de TODAS las páginas van en la política de cada una: al cambiar de página sin recargar
// (un `<Link>` de Next), React inserta el `<style>` de la página nueva bajo la política de la primera (S2, fase 2:
// las reglas de los pasos del recorrido quedaban bloqueadas al llegar desde el nivel 1). Los scripts no: React no
// ejecuta un `<script>` en línea que inserta en el cliente.
// En Vercel, Next 16 compila con el adapter de Vercel (`NEXT_ENABLE_ADAPTER=1`): dentro de `next build` copia cada
// página a `.next/output/static/`, y Vercel publica ESA copia, no `out/` (S2-AUD-32: el preview del PR #5 servía las
// páginas sin su meta). Por eso se inyecta en cada carpeta que se publica: `out/` y, si el adapter corrió (deja
// `.next/output/config.json`), también `.next/output/static/`. Cada una con sus propias huellas.
//
// Uso: node scripts/csp/inyectar.mjs [carpeta]   (por defecto, las de `carpetasDeSalida`)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
 * Las huellas de los `<style>` en línea de una página.
 * @param {string} html
 * @returns {string[]}
 */
export function estilosEnLinea(html) {
  return unicas([...html.matchAll(ESTILO_EN_LINEA)].map((m) => huella(m[1])));
}

/**
 * El HTML con su CSP. Lanza si la página trae lo que una CSP con huellas no puede permitir sin `unsafe-hashes`.
 * `estilosDelSitio`: las huellas de estilo de las demás páginas, a las que se llega sin recargar.
 * @param {string} html
 * @param {{ conectar?: string[], archivo?: string, estilosDelSitio?: string[] }} [opciones]
 * @returns {{ html: string, scripts: number, estilos: number }}
 */
export function conCSP(html, { conectar = [], archivo = "página", estilosDelSitio = [] } = {}) {
  const limpio = html.replace(META, "");
  if (!limpio.includes(CHARSET)) throw new Error(`${archivo}: no trae ${CHARSET}; la CSP tiene que ir antes de cualquier script`);
  const sinCodigo = limpio.replace(SCRIPT_EN_LINEA, "").replace(ESTILO_EN_LINEA, "");
  const atributo = sinCodigo.match(/<[a-zA-Z][^>]*?\s(style|on[a-z]+)=/);
  if (atributo) throw new Error(`${archivo}: trae el atributo en línea «${atributo[1]}=»; muévelo a una clase o a un script`);
  const scripts = unicas([...limpio.matchAll(SCRIPT_EN_LINEA)].map((m) => huella(m[1])));
  const estilos = unicas([...estilosEnLinea(limpio), ...estilosDelSitio]);
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

/**
 * Las carpetas que se publican desde la raíz `raiz`: `out/` y, si el adapter de Vercel corrió, su copia.
 * @param {string} raiz
 * @returns {string[]}
 */
export function carpetasDeSalida(raiz) {
  const adapter = join(raiz, ".next/output");
  return [join(raiz, "out"), ...(existsSync(join(adapter, "config.json")) ? [join(adapter, "static")] : [])];
}

/** Las páginas de una carpeta publicada, sin la maqueta (`diseno/` en su raíz), que lleva CSP de cabecera. */
function paginas(carpeta, dir = carpeta) {
  return readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    if (statSync(ruta).isDirectory()) return f === "diseno" && dir === carpeta ? [] : paginas(carpeta, ruta);
    return f.endsWith(".html") ? [ruta] : [];
  });
}

/**
 * Inyecta la CSP en cada página de una carpeta publicada.
 * @param {string} carpeta
 * @param {{ conectar?: string[], raiz?: string }} [opciones]
 * @returns {{ paginas: number, scripts: number, estilos: number, sitio: number }}
 */
export function inyectar(carpeta, { conectar = [], raiz = RAIZ } = {}) {
  const lista = paginas(carpeta);
  const estilosDelSitio = unicas(lista.flatMap((ruta) => estilosEnLinea(readFileSync(ruta, "utf8"))));
  let scripts = 0;
  let estilos = 0;
  for (const ruta of lista) {
    const r = conCSP(readFileSync(ruta, "utf8"), { conectar, archivo: relative(raiz, ruta), estilosDelSitio });
    writeFileSync(ruta, r.html);
    scripts += r.scripts;
    estilos += r.estilos;
  }
  return { paginas: lista.length, scripts, estilos, sitio: estilosDelSitio.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const conectar = origenSentry();
  for (const carpeta of process.argv[2] ? [resolve(process.argv[2])] : carpetasDeSalida(RAIZ)) {
    const r = inyectar(carpeta, { conectar });
    console.log(
      `csp: ${relative(RAIZ, carpeta)}/ · ${r.paginas} páginas · ${r.scripts} huellas de script · ${r.estilos} de estilo (${r.sitio} en el sitio)${conectar.length ? ` · connect-src ${conectar.join(" ")}` : ""}`,
    );
  }
}
