// Hook PreToolUse (WebFetch y WebSearch) del investigador: ninguna petición externa lleva un identificador
// del usuario (correo y nombre de git, usuario y equipo del sistema, carpeta personal), y toda URL es https.
// El mensaje de bloqueo no repite el identificador.
import { execFileSync } from "node:child_process";
import { homedir, hostname, userInfo } from "node:os";
import { basename } from "node:path";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

function git(clave) {
  try {
    return execFileSync("git", ["config", "--get", clave], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function identificadores() {
  const email = git("user.email");
  const nombre = git("user.name");
  const extra = (process.env.BIGD_IDENTIFICADORES ?? "").split(",");
  const todos = [email, email.split("@")[0], nombre, ...nombre.split(/\s+/), userInfo().username, hostname().split(".")[0], basename(homedir()), ...extra];
  return [...new Set(todos.map((x) => (x ?? "").trim().toLowerCase()).filter((x) => x.length >= 4))];
}

const e = entrada();
if (!esInvestigador(e)) pasar();
const ti = e.tool_input ?? {};
const texto = JSON.stringify(ti).toLowerCase();
if (identificadores().some((id) => texto.includes(id)))
  bloquear("BLOQUEADO: la petición lleva un identificador del usuario. El investigador consulta solo documentación pública, sin datos de quien investiga.");
if (e.tool_name === "WebFetch" && !/^https:\/\//i.test(String(ti.url ?? ""))) bloquear("BLOQUEADO: el investigador solo consulta fuentes https.");
pasar();
