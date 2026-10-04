// Gate de la CSP en lo que Vercel PUBLICA (S2-AUD-32). Next 16 compila en Vercel con su adapter, que copia las
// páginas a `.next/output/static/` dentro de `next build`; Vercel publica esa copia, no `out/`. La CI hace el build
// como Vercel (`vercel build` sin conexión ni sesión, con `NEXT_ENABLE_ADAPTER=1`) y este script mira el resultado:
// cada página de la carpeta publicada (sin la maqueta, `diseno/`, que lleva CSP de cabecera) trae UNA meta de CSP
// justo después de `<meta charSet>`, y es idéntica byte a byte a la de `out/`, que es la que prueban las e2e. Sin
// páginas, también falla: una carpeta vacía no demuestra nada.
//
// Uso: node scripts/csp/verificar-salida.mjs <carpeta-publicada> [referencia=out]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const CHARSET = '<meta charSet="utf-8"/>';
const META = /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/g;

function paginas(carpeta, dir = carpeta) {
  return readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    if (statSync(ruta).isDirectory()) return f === "diseno" && dir === carpeta ? [] : paginas(carpeta, ruta);
    return f.endsWith(".html") ? [relative(carpeta, ruta)] : [];
  });
}

/**
 * Lo que falla en la carpeta publicada `publicada`, comparada con `referencia`. Vacío = todo bien.
 * @param {string} publicada
 * @param {string} referencia
 * @returns {{ paginas: number, fallas: string[] }}
 */
export function fallasDeSalida(publicada, referencia) {
  if (!existsSync(publicada)) return { paginas: 0, fallas: [`${publicada}: no existe`] };
  const lista = paginas(publicada).sort();
  const fallas = lista.length ? [] : [`${publicada}: no tiene páginas`];
  for (const p of lista) {
    const html = readFileSync(join(publicada, p), "utf8");
    const metas = html.match(META) ?? [];
    if (metas.length !== 1) fallas.push(`${p}: ${metas.length} metas de CSP (se espera 1)`);
    else if (html.indexOf(metas[0]) !== html.indexOf(CHARSET) + CHARSET.length) fallas.push(`${p}: la CSP no va justo después de ${CHARSET}`);
    const ref = join(referencia, p);
    if (!existsSync(ref)) fallas.push(`${p}: no está en ${referencia}`);
    else if (readFileSync(ref, "utf8") !== html) fallas.push(`${p}: distinta de la de ${referencia}`);
  }
  const publicadas = new Set(lista);
  if (existsSync(referencia)) for (const p of paginas(referencia)) if (!publicadas.has(p)) fallas.push(`${p}: está en ${referencia} y no se publica`);
  return { paginas: lista.length, fallas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [publicada, referencia = "out"] = process.argv.slice(2);
  if (!publicada) {
    console.error("uso: node scripts/csp/verificar-salida.mjs <carpeta-publicada> [referencia=out]");
    process.exit(2);
  }
  const r = fallasDeSalida(publicada, referencia);
  if (r.fallas.length) {
    console.error(`csp publicada: ${r.fallas.length} fallas en ${publicada}\n${r.fallas.map((f) => `  - ${f}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`csp publicada: ${r.paginas} páginas en ${publicada}, cada una con su meta e idéntica a ${referencia}`);
}
