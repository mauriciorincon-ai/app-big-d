// Hook de fin del investigador (SubagentStop / Stop del agente): la propuesta más reciente de esta corrida
// debe pasar la validación por código y tener sus citas verificadas. Si no, el agente sigue (salida 2, con
// las fallas) hasta 2 reintentos; al tercer intento se deja terminar y queda error-validacion.json con las
// fallas: jamás se da por buena una propuesta inválida, ni se insiste para siempre.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { cargarTs, RAIZ_REPO } from "../../lib/cargar-ts.mjs";
import { bloquear, entrada, esInvestigador, pasar } from "./entrada.mjs";

const RAIZ = resolve(process.env.BIGD_RAIZ ?? RAIZ_REPO);
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

const inv = await cargarTs("src/lib/investigador/index.ts");
const { parse } = await import("yaml");
const fallas = [];
const bytes = readFileSync(join(dir, "propuesta.json"));
let dato;
try {
  dato = JSON.parse(bytes.toString("utf8"));
} catch (err) {
  fallas.push(`propuesta.json no es JSON: ${err.message}`);
}
if (dato) {
  const gid = dato?.mapa?.gramatica_id;
  const rutaG = join(RAIZ, "data/gramaticas", `${gid}.gramatica.yaml`);
  if (!existsSync(rutaG)) fallas.push(`no existe la gramática «${gid}»`);
  else {
    const rangos = JSON.parse(readFileSync(join(RAIZ_REPO, "packages/diagramador/metricas/cobertura.json"), "utf8")).fuentes["space-grotesk"].rangos;
    fallas.push(...inv.validarPropuesta(dato, parse(readFileSync(rutaG, "utf8")), rangos).fallas);
  }
  if (!fallas.length) {
    const rutaV = join(dir, "verificacion.json");
    const v = existsSync(rutaV) ? JSON.parse(readFileSync(rutaV, "utf8")) : null;
    if (!v || v.propuesta_sha256 !== inv.sha256(bytes)) fallas.push(`faltan las citas verificadas de esta versión: corre node scripts/verificar-citas.mjs ${join("propuestas", dir.slice(base.length + 1))}`);
  }
}
if (!fallas.length) pasar();

const contador = join(dir, ".reintentos");
const hechos = existsSync(contador) ? Number(readFileSync(contador, "utf8")) || 0 : 0;
if (hechos < 2) {
  writeFileSync(contador, String(hechos + 1));
  bloquear(`La propuesta todavía no pasa (reintento ${hechos + 1} de 2). Corrígela y vuelve a validar:\n${fallas.join("\n")}`);
}
writeFileSync(join(dir, "error-validacion.json"), `${JSON.stringify({ fecha_hora: new Date().toISOString(), reintentos: hechos, fallas }, null, 2)}\n`);
pasar();
