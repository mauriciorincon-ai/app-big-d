// S10 (F2): el gate de fugas del paquete público (riesgo nº 1 del sprint; regla dura 14 y decisions/design-mockup-destination.md).
// Recorre cada archivo de out-demo/ y falla si encuentra lo que NUNCA viaja a CV Viva: el investigador, la aprobación, las
// propuestas, la maqueta, un comando del repo o un enlace que salga del sitio. También comprueba el manifiesto (cada archivo
// con su huella, ni uno de más ni de menos) y que cada página trae su CSP por meta. Las licencias OFL de las fuentes (.txt)
// citan su URL de origen, que la licencia exige conservar: no son enlaces de la página.
// Uso: node scripts/demo/fugas.mjs [carpeta=out-demo]
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Lo que jamás aparece en el paquete, con su razón. Insensible a mayúsculas. */
export const PROHIBIDO = [
  [/investigador|investigator|\/investigar\b/i, "el investigador (solo existe en la app privada)"],
  [/aprobar\.mjs|puedeAprobar|node scripts\//i, "un comando de aprobación o del repo"],
  [/propuestas\/|proposals\//i, "las propuestas del investigador"],
  [/diseno\/|maqueta|mockup/i, "la maqueta (A-25)"],
  [/vercel\.app|\.vercel\b/i, "un host de la app privada"],
  [/sentry/i, "la observabilidad de la app privada"],
  [/pnpm (?:aprobar|maqueta|capturas|tokens|paleta|datos|investigar)|\.claude\//i, "un comando o una carpeta de trabajo del repo"],
  [/\blocalhost\b|\b(?:\d{1,3}\.){3}\d{1,3}\b/i, "una dirección local o una IP (el paquete no habla con ningún servidor)"],
];
/** Los únicos URI absolutos permitidos fuera de las licencias: espacios de nombres XML, que no se piden. */
const NAMESPACES = new Set(["http://www.w3.org/2000/svg", "http://www.w3.org/1999/xlink", "http://www.w3.org/1999/xhtml"]);
const TEXTO = /\.(html|js|css|json|txt|svg)$/;
const CSP = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"\/>/g;

const archivos = (dir, base = dir) =>
  readdirSync(dir)
    .flatMap((f) => (statSync(join(dir, f)).isDirectory() ? archivos(join(dir, f), base) : [relative(base, join(dir, f))]))
    .sort();

/** Las fugas de la carpeta del paquete; vacío = el paquete es público por diseño. */
export function fugasDe(dir) {
  if (!existsSync(dir)) return [`${dir}: no existe (corre pnpm build:demo)`];
  const fallas = [];
  const lista = archivos(dir);
  for (const f of lista) {
    if (/(^|\/)diseno(\/|$)/.test(f)) fallas.push(`${f}: ruta de la maqueta`);
    if (!TEXTO.test(f)) continue;
    const texto = readFileSync(join(dir, f), "utf8");
    for (const [re, que] of PROHIBIDO)
      for (const m of new Set([...texto.matchAll(new RegExp(re.source, "gi"))].map((x) => x[0]))) fallas.push(`${f}: «${m}» — ${que}`);
    if (f.endsWith(".txt")) continue;
    for (const m of texto.matchAll(/\b(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'<>)]*/gi)) if (!NAMESPACES.has(m[0])) fallas.push(`${f}: enlace absoluto «${m[0]}» — nada sale del sitio`);
    for (const m of texto.matchAll(/\b(?:href|src|action)\s*=\s*["'](\/[^"']*)["']/g)) fallas.push(`${f}: ruta desde la raíz «${m[1]}» — se saldría del basePath`);
    for (const m of texto.matchAll(/\b(?:href|src|action)\s*=\s*["'](\.\.\/[^"']*)["']/g)) fallas.push(`${f}: ruta que sube de carpeta «${m[1]}» — se saldría del paquete`);
    for (const m of texto.matchAll(/url\(\s*["']?(\/[^)"']*)/g)) fallas.push(`${f}: url() desde la raíz «${m[1]}» — se saldría del basePath`);
    for (const m of texto.matchAll(/\b(?:mailto|tel|javascript):/gi)) fallas.push(`${f}: «${m[0]}»`);
    if (f.endsWith(".html")) {
      const metas = [...texto.matchAll(CSP)];
      if (metas.length !== 1) fallas.push(`${f}: ${metas.length} metas de CSP (se espera 1)`);
      else if (/unsafe-inline|unsafe-eval|\*/.test(metas[0][1].replace("'unsafe-hashes'", ""))) fallas.push(`${f}: la CSP abre algo que no debe: ${metas[0][1]}`);
    }
  }
  const mpath = join(dir, "manifiesto.json");
  if (!existsSync(mpath)) fallas.push("manifiesto.json: no existe");
  else {
    const m = JSON.parse(readFileSync(mpath, "utf8"));
    const declarados = Object.keys(m.archivos ?? {}).sort();
    const reales = lista.filter((f) => f !== "manifiesto.json");
    if (declarados.join("|") !== reales.join("|")) fallas.push(`manifiesto.json: declara [${declarados.join(", ")}] y hay [${reales.join(", ")}]`);
    for (const f of reales) {
      const h = createHash("sha256").update(readFileSync(join(dir, f))).digest("hex");
      if (m.archivos?.[f] !== undefined && m.archivos[f] !== h) fallas.push(`manifiesto.json: la huella de ${f} no es la del archivo`);
    }
    for (const e of m.entradas ?? []) if (!reales.includes(e)) fallas.push(`manifiesto.json: la entrada ${e} no está en el paquete`);
    if (m.basePath !== "/piezas/big-d") fallas.push(`manifiesto.json: basePath ${m.basePath} (se espera /piezas/big-d)`);
  }
  return fallas;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? "out-demo");
  const f = fugasDe(dir);
  if (f.length) {
    console.error(`demo: ${f.length} fugas en ${dir}\n${f.map((x) => `  - ${x}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`demo: ${dir} es público por diseño (sin fugas; manifiesto y CSP al día)`);
}
