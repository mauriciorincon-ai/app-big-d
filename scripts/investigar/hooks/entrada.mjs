// Lectura común de los hooks del investigador: el JSON que Claude Code manda por stdin, y las salidas.
// Un hook que BLOQUEA sale con 2 y explica en stderr (Claude Code se lo muestra al agente); uno que deja
// pasar sale con 0. Los hooks de Claude Code informan `agent_type` cuando quien llama es un subagente.
import { readFileSync } from "node:fs";

export const entrada = () => {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
};

/**
 * ¿Llama el investigador? Lo dice `agent_type`; y los hooks declarados en el propio agente
 * (.claude/agents/investigador.md) pasan `--investigador`, por si algún día `agent_type` no llegara.
 */
export const esInvestigador = (e) => e.agent_type === "investigador" || process.argv.includes("--investigador");

export function bloquear(motivo) {
  process.stderr.write(`${motivo}\n`);
  process.exit(2);
}

export const pasar = () => process.exit(0);
