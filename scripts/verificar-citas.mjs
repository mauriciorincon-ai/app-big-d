// Verificador de citas POR CÓDIGO (el investigador propone; esto comprueba). Para cada afirmación de una
// propuesta baja la página con `curl` —sin cookies, sin sesión, sin ningún dato del usuario, con un agente
// genérico— y busca la cita textual en el texto de la página cruda (src/lib/investigador/texto.ts). Resultado
// por afirmación: verificada · no-encontrada (el código la rechaza) · no-verificable (la revisa una persona),
// con el código HTTP y la huella SHA-256 de lo que bajó. Escribe verificacion.json junto a la propuesta.
//
// Uso: node scripts/verificar-citas.mjs propuestas/<fecha>-<plataforma>[-<capa>]
// Pruebas: BIGD_VERIFICAR_ESPEJO="https://ejemplo.invalid/=file:///ruta/" sirve un prefijo desde disco.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { cargarTs } from "./lib/cargar-ts.mjs";
import { carpetaPropuesta, hoy, identificadores, RAIZ } from "./investigar/comun.mjs";

const AGENTE = "Mozilla/5.0 (compatible; Big-D-verificador-de-citas/1.0)";
const espejo = (() => {
  const v = process.env.BIGD_VERIFICAR_ESPEJO;
  if (!v) return null;
  const [de, a] = v.split("=");
  return { de, a };
})();

function bajar(url, tmp) {
  const real = espejo && url.startsWith(espejo.de) ? espejo.a + url.slice(espejo.de.length) : url;
  const local = real.startsWith("file://");
  const salida = join(tmp, "pagina");
  try {
    const codigo = execFileSync(
      "curl",
      // `-q` primero: no lee ~/.curlrc; `-g`: no expande `{a,b}` ni `[1-9]` de la URL (B-30).
      ["-q", "-g", "-sS", "-L", "--max-redirs", "5", "--max-time", "25", "--proto", local ? "=file" : "=https", "-A", AGENTE, "-H", "Accept-Language: en, es", "-o", salida, "-w", "%{http_code}", real],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    const cuerpo = readFileSync(salida);
    return { http: local ? 200 : Number(codigo), cuerpo };
  } catch (e) {
    return { http: null, cuerpo: null, motivo: String(e.stderr || e.message).trim().split("\n")[0] };
  }
}

try {
  const dir = carpetaPropuesta(process.argv[2]);
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const bytes = readFileSync(join(dir, "propuesta.json"));
  const forma = inv.esquemaPropuesta.safeParse(JSON.parse(bytes.toString("utf8")));
  if (!forma.success) throw new Error(`propuesta.json no pasa el esquema; corre antes scripts/investigar/validar.mjs`);
  // Ninguna petición lleva un identificador de quien investiga (M-18 de la auditoría del S1): el hook lo
  // vigila en WebFetch, y este script también baja URLs. Si una lo lleva, no se baja nada ni se escribe nada.
  const ids = identificadores();
  const legible = (u) => {
    try {
      return decodeURIComponent(u).toLowerCase();
    } catch {
      return u.toLowerCase();
    }
  };
  const conId = forma.data.afirmaciones.filter((a) => ids.some((x) => legible(a.cita.url).includes(x)));
  if (conId.length) throw new Error(`${conId.map((a) => a.id).join(", ")}: la URL de la cita lleva un identificador de quien investiga; no se consulta`);
  const tmp = mkdtempSync(join(tmpdir(), "bigd-citas-"));
  const cache = new Map();
  const resultados = [];
  for (const a of forma.data.afirmaciones) {
    if (!cache.has(a.cita.url)) cache.set(a.cita.url, bajar(a.cita.url, tmp));
    const b = cache.get(a.cita.url);
    const v = inv.verificarCita(b.http, b.cuerpo ? b.cuerpo.toString("utf8") : null, a.cita.texto);
    resultados.push({
      afirmacion: a.id,
      url: a.cita.url,
      resultado: v.resultado,
      http: b.http,
      sha256: b.cuerpo ? inv.sha256(b.cuerpo) : null,
      ...(v.motivo || b.motivo ? { motivo: v.motivo ?? b.motivo } : {}),
    });
  }
  const verificacion = { version: 1, fecha: hoy("BIGD_FECHA_CONSULTA"), propuesta_sha256: inv.sha256(bytes), resultados };
  inv.esquemaVerificacion.parse(verificacion);
  writeFileSync(join(dir, "verificacion.json"), `${JSON.stringify(verificacion, null, 2)}\n`);
  const cuenta = (r) => resultados.filter((x) => x.resultado === r).length;
  console.log(`verificar-citas: ${relative(RAIZ, dir)} · ${resultados.length} afirmaciones · ${cuenta("verificada")} verificadas · ${cuenta("no-verificable")} no verificables · ${cuenta("no-encontrada")} no encontradas · ${cache.size} páginas`);
} catch (e) {
  console.error(`verificar-citas: ${e.message}`);
  process.exit(1);
}
