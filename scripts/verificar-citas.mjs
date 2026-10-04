// Verificador de citas POR CÓDIGO (el investigador propone; esto comprueba). Para cada afirmación de una
// propuesta, y para cada retiro (lo que sale del mapa aprobado, con la cita que prueba por qué), baja la página con `curl` —sin cookies, sin sesión, sin ningún dato del usuario, con un agente
// genérico; si el servidor corta la conexión, reintenta con HTTP/1.1 y luego sin el agente— y busca la cita textual
// en el texto de la página cruda (src/lib/investigador/texto.ts). Resultado
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

/** Salidas de curl de una conexión cortada: 92 (un flujo HTTP/2 que el servidor cerró) y 56 (fallo al recibir). */
const CORTADA = new Set([92, 56]);

// Hay servidores que cortan HTTP/2 ante un agente que no conocen (GlobeNewswire, S2-AUD-39: corta HTTP/2 y, con
// HTTP/1.1 y el agente propio, no responde hasta agotar el tiempo). Si la conexión se corta, un reintento con HTTP/1.1
// y, si sigue cortándose o no responde, otro sin el agente propio. Ninguno lleva cookies, sesión ni datos del usuario;
// el resultado dice qué reintento bajó la página.
const INTENTOS = [
  { args: ["-A", AGENTE] },
  { args: ["--http1.1", "-A", AGENTE], reintento: "http1.1" },
  { args: ["--http1.1"], reintento: "sin-agente" },
];

function bajar(url, tmp) {
  const real = espejo && url.startsWith(espejo.de) ? espejo.a + url.slice(espejo.de.length) : url;
  const local = real.startsWith("file://");
  const salida = join(tmp, "pagina");
  let falla;
  for (const { args, reintento } of INTENTOS) {
    try {
      const codigo = execFileSync(
        "curl",
        // `-q` primero: no lee ~/.curlrc; `-g`: no expande `{a,b}` ni `[1-9]` de la URL (B-30).
        ["-q", "-g", "-sS", "-L", "--max-redirs", "5", "--max-time", "25", "--proto", local ? "=file" : "=https", ...args, "-H", "Accept-Language: en, es", "-o", salida, "-w", "%{http_code}", real],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      const cuerpo = readFileSync(salida);
      return { http: local ? 200 : Number(codigo), cuerpo, ...(reintento ? { reintento } : {}) };
    } catch (e) {
      falla = { http: null, cuerpo: null, motivo: String(e.stderr || e.message).trim().split("\n")[0] };
      // En un reintento, un tiempo agotado (28) también sigue al próximo: el primer intento ya mostró el corte.
      if (!CORTADA.has(e.status) && !(reintento && e.status === 28)) return falla;
    }
  }
  return falla;
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
  // Afirmaciones (A-n) y retiros (R-n): toda cita de la propuesta pasa por el mismo camino.
  const citas = [...forma.data.afirmaciones, ...forma.data.retiros];
  const conId = citas.filter((a) => ids.some((x) => legible(a.cita.url).includes(x)));
  if (conId.length) throw new Error(`${conId.map((a) => a.id).join(", ")}: la URL de la cita lleva un identificador de quien investiga; no se consulta`);
  const tmp = mkdtempSync(join(tmpdir(), "bigd-citas-"));
  const cache = new Map();
  const resultados = [];
  for (const a of citas) {
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
      ...(b.reintento ? { reintento: b.reintento } : {}),
    });
  }
  const verificacion = { version: 1, fecha: hoy("BIGD_FECHA_CONSULTA"), propuesta_sha256: inv.sha256(bytes), resultados };
  inv.esquemaVerificacion.parse(verificacion);
  writeFileSync(join(dir, "verificacion.json"), `${JSON.stringify(verificacion, null, 2)}\n`);
  const cuenta = (r) => resultados.filter((x) => x.resultado === r).length;
  const retiros = forma.data.retiros.length ? ` y ${forma.data.retiros.length} retiros` : "";
  console.log(`verificar-citas: ${relative(RAIZ, dir)} · ${forma.data.afirmaciones.length} afirmaciones${retiros} · ${cuenta("verificada")} verificadas · ${cuenta("no-verificable")} no verificables · ${cuenta("no-encontrada")} no encontradas · ${cache.size} páginas`);
} catch (e) {
  console.error(`verificar-citas: ${e.message}`);
  process.exit(1);
}
