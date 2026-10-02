// Hook PreToolUse (WebFetch y WebSearch) del investigador: ninguna petición externa lleva un identificador
// del usuario (correo y nombre de git, usuario y equipo del sistema, carpeta personal), y toda URL es https.
// El mensaje de bloqueo no repite el identificador.
import { identificadores } from "../comun.mjs";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

const e = entrada();
if (!esInvestigador(e)) pasar();
const ti = e.tool_input ?? {};
const texto = JSON.stringify(ti).toLowerCase();
if (identificadores().some((id) => texto.includes(id)))
  bloquear("BLOQUEADO: la petición lleva un identificador del usuario. El investigador consulta solo documentación pública, sin datos de quien investiga.");
if (e.tool_name === "WebFetch" && !/^https:\/\//i.test(String(ti.url ?? ""))) bloquear("BLOQUEADO: el investigador solo consulta fuentes https.");
pasar();
