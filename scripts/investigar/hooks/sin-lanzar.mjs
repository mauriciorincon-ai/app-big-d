// Hook PreToolUse (Agent / Task) — el investigador solo lo lanza una PERSONA escribiendo /investigar.
// `disable-model-invocation` impide que el modelo invoque la skill, pero no que lance el subagente
// `investigador` directamente con la herramienta Agent (M-17 de la auditoría del S1). La skill corre en su
// propio contexto (`context: fork` + `agent: investigador`) y no pasa por aquí.
import { bloquear, entrada, pasar } from "./entrada.mjs";

const e = entrada();
const tipo = String(e.tool_input?.subagent_type ?? "").trim().toLowerCase();
if (["Agent", "Task"].includes(e.tool_name) && tipo === "investigador")
  bloquear("BLOQUEADO: el investigador solo lo lanza una persona con /investigar (la IA propone cuando alguien se lo pide; jamás corre sola).");
pasar();
