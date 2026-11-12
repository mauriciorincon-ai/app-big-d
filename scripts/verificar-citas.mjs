// Verificador de citas POR CÓDIGO (el investigador propone; esto comprueba). Para cada afirmación de una
// propuesta (o cada fuente de cada evidencia, en una propuesta de evidencias), y para cada retiro (lo que sale del mapa aprobado, con la cita que prueba por qué), baja la página con `curl` —sin cookies, sin sesión, sin ningún dato del usuario, con un agente
// genérico; si el servidor corta la conexión, reintenta con HTTP/1.1 y luego sin el agente— y busca la cita textual
// en el texto de la página cruda (src/lib/investigador/texto.ts). Resultado
// por afirmación: verificada · no-encontrada (el código la rechaza) · no-verificable (la revisa una persona),
// con el código HTTP y la huella SHA-256 de lo que bajó. Escribe verificacion.json junto a la propuesta.
//
// Uso: node scripts/verificar-citas.mjs propuestas/<fecha>-<plataforma>[-<capa>]
// Pruebas: BIGD_VERIFICAR_ESPEJO="https://ejemplo.invalid/=file:///ruta/" sirve un prefijo desde disco.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { cargarTs } from "./lib/cargar-ts.mjs";
import { bajar } from "./investigar/bajar.mjs";
import { carpetaPropuesta, hoy, identificadores, RAIZ } from "./investigar/comun.mjs";

try {
  const dir = carpetaPropuesta(process.argv[2]);
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const bytes = readFileSync(join(dir, "propuesta.json"));
  const dato = JSON.parse(bytes.toString("utf8"));
  // Una propuesta de evidencias (D-S3-10) trae una cita por fuente de cada evidencia; una de mapa, una por afirmación.
  const deEvidencias = inv.esPropuestaDeEvidencias(dato);
  const forma = (deEvidencias ? inv.esquemaPropuestaEvidencias : inv.esquemaPropuesta).safeParse(dato);
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
  // Afirmaciones (A-n) y retiros (R-n), o cada fuente de cada evidencia (A-n y su número): toda cita pasa por el mismo camino.
  const citas = deEvidencias ? inv.citasDe(forma.data) : [...forma.data.afirmaciones, ...forma.data.retiros].map((a) => ({ id: a.id, url: a.cita.url, texto: a.cita.texto }));
  const conId = citas.filter((a) => ids.some((x) => legible(a.url).includes(x)));
  if (conId.length) throw new Error(`${conId.map((a) => a.id).join(", ")}: la URL de la cita lleva un identificador de quien investiga; no se consulta`);
  const tmp = mkdtempSync(join(tmpdir(), "bigd-citas-"));
  const cache = new Map();
  const resultados = [];
  for (const a of citas) {
    if (!cache.has(a.url)) cache.set(a.url, bajar(a.url, tmp));
    const b = cache.get(a.url);
    const v = inv.verificarCita(b.http, b.cuerpo ? b.cuerpo.toString("utf8") : null, a.texto);
    resultados.push({
      afirmacion: a.id,
      ...(a.fuente !== undefined ? { fuente: a.fuente } : {}),
      url: a.url,
      resultado: v.resultado,
      http: b.http,
      sha256: b.cuerpo ? inv.sha256(b.cuerpo) : null,
      ...(v.motivo || b.motivo ? { motivo: v.motivo ?? b.motivo } : {}),
      ...(b.reintento ? { reintento: b.reintento } : {}),
    });
  }
  // Lo bajado ya está en memoria (y su huella en el resultado): el temporal no se queda.
  rmSync(tmp, { recursive: true, force: true });
  const verificacion = { version: 1, fecha: hoy("BIGD_FECHA_CONSULTA"), propuesta_sha256: inv.sha256(bytes), resultados };
  inv.esquemaVerificacion.parse(verificacion);
  writeFileSync(join(dir, "verificacion.json"), `${JSON.stringify(verificacion, null, 2)}\n`);
  const cuenta = (r) => resultados.filter((x) => x.resultado === r).length;
  const que = deEvidencias
    ? `${forma.data.evidencias.length} evidencias · ${citas.length} citas`
    : `${forma.data.afirmaciones.length} afirmaciones${forma.data.retiros.length ? ` y ${forma.data.retiros.length} retiros` : ""}`;
  console.log(`verificar-citas: ${relative(RAIZ, dir)} · ${que} · ${cuenta("verificada")} verificadas · ${cuenta("no-verificable")} no verificables · ${cuenta("no-encontrada")} no encontradas · ${cache.size} páginas`);
} catch (e) {
  console.error(`verificar-citas: ${e.message}`);
  process.exit(1);
}
