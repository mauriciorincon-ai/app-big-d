// Hook PreToolUse (Write, Edit, MultiEdit, NotebookEdit) — gitleaks sobre LO QUE SE VA A ESCRIBIR. El comando
// anterior del kit corría `gitleaks protect --staged`, que mira el índice de git y no el texto nuevo: un
// secreto escrito por el agente pasaba y solo lo paraba el pre-commit (B-25 de la auditoría del S1; se
// propone al kit). Sale con 2 si gitleaks encuentra algo; sin gitleaks instalado avisa y deja pasar (el
// pre-commit de git sigue siendo el segundo cinturón).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

let e = {};
try {
  e = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}
const ti = e.tool_input ?? {};
const partes = [ti.content, ti.new_string, ti.new_source, ...(Array.isArray(ti.edits) ? ti.edits.map((x) => x?.new_string) : [])].filter((x) => typeof x === "string" && x);
if (!partes.length) process.exit(0);
const r = spawnSync("gitleaks", ["stdin", "--no-banner", "--redact", "--log-level", "error"], { input: partes.join("\n"), encoding: "utf8" });
if (r.error) {
  process.stderr.write("gitleaks no está instalado: la escritura no se revisó (el pre-commit de git sí la revisará).\n");
  process.exit(0);
}
if (r.status === 1) {
  process.stderr.write("SECRET DETECTADO en lo que se iba a escribir. Escritura bloqueada: mueve la clave a .env.local / Vercel env vars.\n");
  process.exit(2);
}
process.exit(0);
