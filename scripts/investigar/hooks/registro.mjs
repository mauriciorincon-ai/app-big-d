// Hook PostToolUse (WebFetch y WebSearch) del investigador: cada fuente consultada queda en
// propuestas/registro-de-ejecucion.jsonl (una línea por consulta; si el hook corre dos veces —frontmatter del
// agente y settings.json— la segunda no duplica). Es el registro de lo que el modelo leyó.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { RAIZ_REPO } from "../../lib/cargar-ts.mjs";
import { entrada, esInvestigador, pasar } from "./entrada.mjs";

const RAIZ = resolve(process.env.BIGD_RAIZ ?? RAIZ_REPO);
const e = entrada();
if (!esInvestigador(e)) pasar();
const archivo = join(RAIZ, "propuestas", "registro-de-ejecucion.jsonl");
const id = e.tool_use_id ?? null;
if (id && existsSync(archivo) && readFileSync(archivo, "utf8").includes(`"tool_use_id":${JSON.stringify(id)}`)) pasar();
const ti = e.tool_input ?? {};
const linea = {
  fecha_hora: new Date().toISOString(),
  herramienta: e.tool_name,
  ...(e.tool_name === "WebSearch" ? { consulta: ti.query ?? null } : { url: ti.url ?? null }),
  // Sin id de sesión ni nada de quien investiga: este archivo viaja al repo público.
  tool_use_id: id,
};
mkdirSync(join(RAIZ, "propuestas"), { recursive: true });
appendFileSync(archivo, `${JSON.stringify(linea)}\n`);
pasar();
