// La lectura de una fuente, COMPARTIDA: la usan el verificador de citas (scripts/verificar-citas.mjs) y el ejecutor del
// modelo del sistema (scripts/investigar/sistema.mjs), para que lo que el modelo lee y lo que el código verifica salgan
// del mismo `curl`. Sin cookies, sin sesión, sin ningún dato del usuario, con un agente genérico.
// Pruebas: BIGD_VERIFICAR_ESPEJO="https://ejemplo.invalid/=file:///ruta/" sirve un prefijo desde disco.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const AGENTE = "Mozilla/5.0 (compatible; Big-D-verificador-de-citas/1.0)";
const espejo = (() => {
  const v = process.env.BIGD_VERIFICAR_ESPEJO;
  if (!v) return null;
  const [de, a] = v.split("=");
  return { de, a };
})();

/**
 * Inglés primero, español después, CON PESO. Con «en, es» (el mismo peso) la documentación de Google servía a veces la
 * traducción al español de la misma URL y la cita inglesa «no aparecía»: la misma propuesta de BigQuery dio entre 17 y 34
 * citas verificadas en 11 corridas (2026-11-12). Con el peso, 8 de 8 en inglés. Una fuente en español ya lleva su idioma
 * en la URL.
 */
export const IDIOMA = "Accept-Language: en, es;q=0.5";

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

/** Baja `url` a `tmp/pagina`: `{ http, cuerpo, reintento? }`, o `{ http: null, cuerpo: null, motivo }` si no respondió. */
export function bajar(url, tmp) {
  const real = espejo && url.startsWith(espejo.de) ? espejo.a + url.slice(espejo.de.length) : url;
  const local = real.startsWith("file://");
  const salida = join(tmp, "pagina");
  let falla;
  for (const { args, reintento } of INTENTOS) {
    try {
      const codigo = execFileSync(
        "curl",
        // `-q` primero: no lee ~/.curlrc; `-g`: no expande `{a,b}` ni `[1-9]` de la URL (B-30).
        ["-q", "-g", "-sS", "-L", "--max-redirs", "5", "--max-time", "25", "--proto", local ? "=file" : "=https", ...args, "-H", IDIOMA, "-o", salida, "-w", "%{http_code}", real],
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
