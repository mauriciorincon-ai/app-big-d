// Hook PreToolUse (Bash, escrituras y lecturas) — el candado del investigador.
//   1. NINGÚN agente (tampoco la sesión principal) corre scripts/aprobar.mjs: aprobar es de una persona. Es la
//      defensa contra el accidente; la frontera está dentro del script (`puedeAprobar`, M-15).
//   2. El subagente `investigador` solo escribe `propuestas/<carpeta>/propuesta.json` (A-1: todo lo demás de
//      propuestas/ lo escribe el código —verificacion.json, el registro, el contador de reintentos— y el
//      modelo no lo toca), solo lee lo de su oficio (M-18) y solo corre, tal cual, los dos scripts de su
//      oficio (validar la propuesta y verificar sus citas), sin encadenar nada.
import { isAbsolute, relative, resolve } from "node:path";
import { RAIZ } from "../raiz.mjs";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

const LANZADOR = /^(?:\S+=\S*\s+)*(?:node|nodejs|bun|deno|npx|env|sh|bash|zsh|exec|eval|source|xargs|nohup|time|pnpm(?:\s+exec|\s+dlx)?|yarn|npm\s+exec)\b/;
const RUTA = /^(?:\S+=\S*\s+)*(?:\.\/)?(?:\S*\/)?scripts\/aprobar\.mjs\b/;

/** Algún tramo del comando empieza lanzando el script (con un intérprete o por su ruta). */
const tramoEjecuta = (texto) =>
  texto
    .split(/&&|\|\||[;|\n(){}]/)
    .map((s) => s.trim().replace(/^["']/, ""))
    .some((s) => (LANZADOR.test(s) && /aprobar\.mjs/.test(s)) || RUTA.test(s));

/**
 * ¿El comando EJECUTA el script de aprobación? Mencionarlo en un grep, un `git add` o un mensaje no cuenta;
 * lo que va dentro de $(…) o entre comillas invertidas se mira con la misma regla, porque también se ejecuta.
 */
export function ejecutaAprobar(comando) {
  if (typeof comando !== "string" || !/aprobar\.mjs/.test(comando)) return false;
  const internos = [...comando.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? "");
  return [comando, ...internos].some(tramoEjecuta);
}

const PERMITIDO = /^node scripts\/(?:investigar\/validar|verificar-citas)\.mjs propuestas\/[A-Za-z0-9][A-Za-z0-9._-]*\/?$/;
/** Lo único que el investigador escribe: el propuesta.json de una carpeta de propuestas/. */
const ESCRIBIBLE = /^propuestas\/[A-Za-z0-9][A-Za-z0-9._-]*\/propuesta\.json$/;
/** Lo que lee: el dato, las propuestas, el contrato de su salida y su propia skill. */
const LEIBLE = /^(?:data|propuestas|src\/lib\/investigador|\.claude\/skills\/investigar)(?:\/|$)/;

/** La ruta relativa a la raíz de trabajo, con «/»; `null` si sale de ella. */
function dentro(ruta, cwd) {
  if (typeof ruta !== "string" || !ruta) return null;
  const r = relative(RAIZ, resolve(cwd, ruta)).split("\\").join("/");
  return r.startsWith("..") || isAbsolute(r) ? null : r;
}

const e = entrada();
const herramienta = e.tool_name;
const ti = e.tool_input ?? {};
const cwd = e.cwd ?? RAIZ;

if (herramienta === "Bash" && ejecutaAprobar(ti.command))
  bloquear("BLOQUEADO: scripts/aprobar.mjs lo corre solo una persona (la IA propone, el humano aprueba). Arma el comando en la pantalla de revisión y pídeselo al usuario.");

if (!esInvestigador(e)) pasar();

if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(herramienta)) {
  const ruta = ti.file_path ?? ti.path ?? ti.notebook_path;
  const r = dentro(ruta, cwd);
  if (!r || !ESCRIBIBLE.test(r))
    bloquear(`BLOQUEADO: el investigador solo escribe propuestas/<carpeta>/propuesta.json (pidió «${ruta ?? "?"}»); lo demás de propuestas/ lo escribe el código.`);
  pasar();
}

if (["Read", "Glob", "Grep"].includes(herramienta)) {
  // Glob y Grep sin `path` buscan en todo el directorio de trabajo: se les pide una carpeta permitida.
  const ruta = herramienta === "Read" ? ti.file_path : ti.path;
  const r = dentro(ruta, cwd);
  const patron = herramienta === "Glob" ? String(ti.pattern ?? "") : herramienta === "Grep" ? String(ti.glob ?? "") : "";
  if (!r || !LEIBLE.test(r) || patron.includes("..") || patron.startsWith("/") || patron.startsWith("~"))
    bloquear(`BLOQUEADO: el investigador solo lee data/, propuestas/, src/lib/investigador/ y .claude/skills/investigar/ (pidió «${ruta ?? "(todo)"}»).`);
  pasar();
}

if (herramienta === "Bash") {
  const c = String(ti.command ?? "").trim();
  if (!PERMITIDO.test(c))
    bloquear("BLOQUEADO: el investigador solo corre, tal cual, `node scripts/investigar/validar.mjs propuestas/<carpeta>` o `node scripts/verificar-citas.mjs propuestas/<carpeta>`.");
}
pasar();
