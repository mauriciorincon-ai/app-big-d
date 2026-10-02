// Hook PostToolUse (WebFetch y WebSearch) del investigador: cada fuente consultada queda en
// propuestas/registro-de-ejecucion.jsonl (una línea por consulta; si el hook corre dos veces —frontmatter del
// agente y settings.json— la segunda no duplica). Es el registro de lo que el modelo leyó.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "../raiz.mjs";
import { entrada, esInvestigador, pasar } from "./entrada.mjs";

const e = entrada();
if (!esInvestigador(e)) pasar();
const archivo = join(RAIZ, "propuestas", "registro-de-ejecucion.jsonl");
// El id de la llamada no viaja crudo al repo público (B-36 de la auditoría del S1): solo los primeros 16
// caracteres de su huella, que bastan para no duplicar la línea.
const id = e.tool_use_id ? createHash("sha256").update(String(e.tool_use_id)).digest("hex").slice(0, 16) : null;
if (id && existsSync(archivo) && readFileSync(archivo, "utf8").includes(`"llamada":${JSON.stringify(id)}`)) pasar();
const ti = e.tool_input ?? {};
const linea = {
  fecha_hora: new Date().toISOString(),
  herramienta: e.tool_name,
  ...(e.tool_name === "WebSearch" ? { consulta: ti.query ?? null } : { url: ti.url ?? null }),
  // Sin id de sesión ni nada de quien investiga: este archivo viaja al repo público.
  llamada: id,
};
mkdirSync(join(RAIZ, "propuestas"), { recursive: true });
appendFileSync(archivo, `${JSON.stringify(linea)}\n`);
pasar();
