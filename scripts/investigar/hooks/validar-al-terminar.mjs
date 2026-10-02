// Hook de fin del investigador (SubagentStop / Stop del agente): la propuesta más reciente de esta corrida
// debe pasar la validación por código y tener sus citas verificadas. Si no, el agente sigue (salida 2, con
// las fallas) hasta 2 reintentos; al tercer intento se deja terminar y queda error-validacion.json con las
// fallas: jamás se da por buena una propuesta inválida, ni se insiste para siempre. Si la validación misma
// se rompe, cuenta como falla y sigue el mismo camino (B-29 de la auditoría del S1: fallar cerrado sin
// dejar al agente en un bucle). Una propuesta que pasa pone el contador en cero (B-35).
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, RAIZ_REPO } from "../raiz.mjs";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

const RECIENTE_MS = 6 * 60 * 60 * 1000;
const e = entrada();
if (!esInvestigador(e)) pasar();

const base = join(RAIZ, "propuestas");
const carpetas = existsSync(base)
  ? readdirSync(base)
      .map((d) => join(base, d))
      .filter((d) => existsSync(join(d, "propuesta.json")))
      .map((d) => ({ d, t: statSync(join(d, "propuesta.json")).mtimeMs }))
      .filter((x) => Date.now() - x.t < RECIENTE_MS)
      .sort((a, b) => b.t - a.t)
  : [];
if (!carpetas.length) pasar();
const dir = carpetas[0].d;
const contador = join(dir, ".reintentos");

async function validar() {
  const { cargarTs } = await import("../../lib/cargar-ts.mjs");
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const { parse } = await import("yaml");
  const fallas = [];
  const bytes = readFileSync(join(dir, "propuesta.json"));
  let dato;
  try {
    dato = JSON.parse(bytes.toString("utf8"));
  } catch (err) {
    return [`propuesta.json no es JSON: ${err.message}`];
  }
  const gid = dato?.mapa?.gramatica_id;
  const rutaG = join(RAIZ, "data/gramaticas", `${gid}.gramatica.yaml`);
  if (!existsSync(rutaG)) return [`no existe la gramática «${gid}»`];
  const rangos = JSON.parse(readFileSync(join(RAIZ_REPO, "packages/diagramador/metricas/cobertura.json"), "utf8")).fuentes["space-grotesk"].rangos;
  // Con el mapa aprobado a la vista: lo que la propuesta retira de él trae su argumento.
  // Solo con un id de plataforma bien formado se arma la ruta (el dato lo escribió el modelo).
  const rutaA = /^[a-z0-9][a-z0-9-]*$/.test(String(dato?.plataforma)) ? join(RAIZ, "data/mapas", `${dato.plataforma}.mapa.yaml`) : null;
  const anterior = rutaA && existsSync(rutaA) ? parse(readFileSync(rutaA, "utf8")) : undefined;
  fallas.push(...inv.validarPropuesta(dato, parse(readFileSync(rutaG, "utf8")), rangos, anterior).fallas);
  if (!fallas.length) {
    const rutaV = join(dir, "verificacion.json");
    const v = existsSync(rutaV) ? JSON.parse(readFileSync(rutaV, "utf8")) : null;
    if (!v || v.propuesta_sha256 !== inv.sha256(bytes)) fallas.push(`faltan las citas verificadas de esta versión: corre node scripts/verificar-citas.mjs ${join("propuestas", dir.slice(base.length + 1))}`);
  }
  return fallas;
}

let fallas;
try {
  fallas = await validar();
} catch (err) {
  fallas = [`la validación por código no pudo correr: ${err?.message ?? err}`];
}
if (!fallas.length) {
  rmSync(contador, { force: true });
  pasar();
}

const hechos = existsSync(contador) ? Number(readFileSync(contador, "utf8")) || 0 : 0;
if (hechos < 2) {
  writeFileSync(contador, String(hechos + 1));
  bloquear(`La propuesta todavía no pasa (reintento ${hechos + 1} de 2). Corrígela y vuelve a validar:\n${fallas.join("\n")}`);
}
writeFileSync(join(dir, "error-validacion.json"), `${JSON.stringify({ fecha_hora: new Date().toISOString(), reintentos: hechos, fallas }, null, 2)}\n`);
pasar();
