// Hook PreToolUse (Bash y escrituras) — el candado del investigador.
//   1. NINGÚN agente (tampoco la sesión principal) corre scripts/aprobar.mjs: aprobar es de una persona.
//   2. El subagente `investigador` solo escribe dentro de propuestas/ y solo corre, tal cual, los dos
//      scripts de su oficio (validar la propuesta y verificar sus citas), sin encadenar nada.
import { resolve, sep } from "node:path";
import { RAIZ_REPO } from "../../lib/cargar-ts.mjs";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

const RAIZ = resolve(process.env.BIGD_RAIZ ?? RAIZ_REPO);
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

const e = entrada();
const herramienta = e.tool_name;
const ti = e.tool_input ?? {};

if (herramienta === "Bash" && ejecutaAprobar(ti.command))
  bloquear("BLOQUEADO: scripts/aprobar.mjs lo corre solo una persona (la IA propone, el humano aprueba). Arma el comando en la pantalla de revisión y pídeselo al usuario.");

if (!esInvestigador(e)) pasar();

if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(herramienta)) {
  const ruta = ti.file_path ?? ti.path ?? ti.notebook_path;
  const destino = typeof ruta === "string" ? resolve(e.cwd ?? RAIZ, ruta) : "";
  if (!destino.startsWith(resolve(RAIZ, "propuestas") + sep))
    bloquear(`BLOQUEADO: el investigador solo escribe dentro de propuestas/ (pidió «${ruta ?? "?"}»).`);
  pasar();
}

if (herramienta === "Bash") {
  const c = String(ti.command ?? "").trim();
  if (!PERMITIDO.test(c))
    bloquear("BLOQUEADO: el investigador solo corre, tal cual, `node scripts/investigar/validar.mjs propuestas/<carpeta>` o `node scripts/verificar-citas.mjs propuestas/<carpeta>`.");
}
pasar();
