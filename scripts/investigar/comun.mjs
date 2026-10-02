// Utilidades comunes de los scripts del investigador: raíz de trabajo, lectura de datos, fecha, la carpeta de
// una propuesta, los identificadores de quien investiga y la guarda de la aprobación.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, hostname, userInfo } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { parse } from "yaml";
import { RAIZ, RAIZ_REPO } from "./raiz.mjs";

export { RAIZ };

export const leerYaml = (ruta) => parse(readFileSync(ruta, "utf8"));

/** El nombre de una carpeta de propuesta: letras, cifras, punto, guion y guion bajo; nada que una terminal expanda. */
export const NOMBRE_CARPETA = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** La carpeta de una propuesta: una carpeta DIRECTA de propuestas/, con nombre seguro (A-2) y su propuesta.json. */
export function carpetaPropuesta(arg) {
  if (!arg) throw new Error("falta la carpeta de la propuesta (propuestas/<fecha>-<plataforma>…)");
  const dir = resolve(RAIZ, arg);
  if (dirname(dir) !== join(RAIZ, "propuestas")) throw new Error(`«${arg}» no está dentro de propuestas/`);
  if (!NOMBRE_CARPETA.test(basename(dir))) throw new Error(`«${arg}»: el nombre de la carpeta solo lleva letras, cifras, «.», «-» y «_»`);
  if (!existsSync(join(dir, "propuesta.json"))) throw new Error(`no hay propuesta.json en ${arg}`);
  return dir;
}

/** Rangos de la fuente del diagrama (V15), de la copia fijada del contrato. */
export const rangos = () => JSON.parse(readFileSync(join(RAIZ_REPO, "packages/diagramador/metricas/cobertura.json"), "utf8")).fuentes["space-grotesk"].rangos;

export function gramaticaDe(mapa) {
  const id = mapa?.gramatica_id;
  const ruta = join(RAIZ, "data/gramaticas", `${id}.gramatica.yaml`);
  if (typeof id !== "string" || !existsSync(ruta)) throw new Error(`no existe la gramática «${id}» en data/gramaticas/`);
  return leerYaml(ruta);
}

const CIVIL = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/**
 * Día de hoy en UTC, o el fijado para pruebas en `variable`; una fecha fijada que no existe es un error
 * (B-33 de la auditoría del S1).
 */
export function hoy(variable) {
  const fijada = process.env[variable];
  if (!fijada) return new Date().toISOString().slice(0, 10);
  if (!CIVIL.test(fijada) || new Date(`${fijada}T00:00:00Z`).toISOString().slice(0, 10) !== fijada) throw new Error(`${variable} no es una fecha AAAA-MM-DD: «${fijada}»`);
  return fijada;
}

function git(clave) {
  try {
    return execFileSync("git", ["config", "--get", clave], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** Lo que identifica a quien investiga (correo y nombre de git, usuario y equipo, carpeta personal), en minúsculas. */
export function identificadores() {
  const email = git("user.email");
  const nombre = git("user.name");
  const extra = (process.env.BIGD_IDENTIFICADORES ?? "").split(",");
  const todos = [email, email.split("@")[0], nombre, ...nombre.split(/\s+/), userInfo().username, hostname().split(".")[0], basename(homedir()), ...extra];
  return [...new Set(todos.map((x) => (x ?? "").trim().toLowerCase()).filter((x) => x.length >= 4))];
}

/**
 * ¿Puede correr la aprobación aquí? Sobre el repo real, solo una persona en su terminal: no desde una sesión
 * de Claude Code (`CLAUDECODE`) ni sin terminal. El candado de Bash es la defensa contra el accidente; esta
 * guarda es la frontera (M-15 de la auditoría del S1: el candado se burlaba con `f=…; node $f` y otras
 * cuatro formas). Sobre una raíz temporal (las pruebas, el kit de prueba) no aplica.
 */
export function puedeAprobar({ raiz, repo, env, tty }) {
  if (resolve(raiz) !== resolve(repo)) return { ok: true };
  if (env.CLAUDECODE) return { ok: false, motivo: "corre dentro de una sesión de Claude Code; ábrelo en tu propia terminal" };
  if (!tty) return { ok: false, motivo: "no hay una terminal interactiva; ábrelo en tu propia terminal" };
  return { ok: true };
}
