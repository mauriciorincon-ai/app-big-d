// @vitest-environment node
// Los hooks del investigador (la regla «la IA propone, el humano aprueba» hecha mecánica): se les da el JSON
// que Claude Code manda por stdin y se mira su salida (2 = bloquea, 0 = deja pasar). Corren sobre una raíz
// temporal (BIGD_RAIZ): jamás tocan propuestas/ del repo.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, utimesSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const RAIZ = mkdtempSync(join(tmpdir(), "bigd-hooks-"));
afterAll(() => rmSync(RAIZ, { recursive: true, force: true }));
const hook = (nombre: string, e: Record<string, unknown>, env: Record<string, string> = {}, args: string[] = []) =>
  spawnSync("node", [`scripts/investigar/hooks/${nombre}.mjs`, ...args], { input: JSON.stringify(e), encoding: "utf8", env: { ...process.env, BIGD_RAIZ: RAIZ, ...env } });
const INV = { agent_type: "investigador", agent_id: "a1", cwd: RAIZ };

describe("candado — nadie corre la aprobación", () => {
  const bash = (command: string, extra = {}) => hook("candado", { tool_name: "Bash", tool_input: { command }, ...extra });
  it.each([
    "node scripts/aprobar.mjs propuestas/x --aprobar A-1 --rechazar -",
    "cd /repo && node scripts/aprobar.mjs propuestas/x",
    "BIGD_X=1 node ./scripts/aprobar.mjs",
    "pnpm exec node scripts/aprobar.mjs",
    "./scripts/aprobar.mjs propuestas/x",
    "bash -c 'node scripts/aprobar.mjs'",
    "echo $(node scripts/aprobar.mjs)",
    "true; node /tmp/repo/scripts/aprobar.mjs",
  ])("bloquea «%s» (sesión principal y subagente)", (c) => {
    expect(bash(c).status).toBe(2);
    expect(bash(c, INV).status).toBe(2);
    expect(bash(c).stderr).toContain("solo una persona");
  });
  it("mirar el código dentro de sustituciones: `node …` dentro de comillas invertidas se ejecuta; una plantilla de JS que lo menciona, no", () => {
    expect(bash("echo `node scripts/aprobar.mjs`").status).toBe(2);
    expect(bash("cat > x.ts <<'EOF'\nconst a = `${b}`; // scripts/aprobar.mjs solo se menciona\nEOF").status).toBe(0);
  });
  it.each(["grep -n aprobar.mjs scripts/*.mjs", "git add scripts/aprobar.mjs", "cat scripts/aprobar.mjs", "pnpm test", "git commit -m 'el script de aprobación'"])("deja pasar «%s» a la sesión principal", (c) => {
    expect(bash(c).status).toBe(0);
  });
});

describe("candado — el investigador escribe solo en propuestas/ y corre solo sus dos scripts", () => {
  const escribir = (herramienta: string, ruta: string) => hook("candado", { ...INV, tool_name: herramienta, tool_input: { file_path: ruta, content: "x" } });
  it("escribe dentro de propuestas/", () => {
    expect(escribir("Write", "propuestas/2026-09-27-fabric/propuesta.json").status).toBe(0);
    expect(escribir("Edit", join(RAIZ, "propuestas/2026-09-27-fabric/propuesta.json")).status).toBe(0);
  });
  it.each(["data/mapas/fabric.mapa.yaml", "propuestas/../data/x.yaml", "src/lib/x.ts", ".claude/settings.json", "/etc/hosts", "propuestasx/a.json"])("no escribe en %s", (r) => {
    const s = escribir("Write", r);
    expect(s.status).toBe(2);
    expect(s.stderr).toContain("solo escribe dentro de propuestas/");
  });
  it("tampoco con la variante `path` ni con NotebookEdit", () => {
    expect(hook("candado", { ...INV, tool_name: "Edit", tool_input: { path: "data/x" } }).status).toBe(2);
    expect(hook("candado", { ...INV, tool_name: "NotebookEdit", tool_input: { notebook_path: "x.ipynb" } }).status).toBe(2);
  });
  it.each(["node scripts/investigar/validar.mjs propuestas/2026-09-27-fabric", "node scripts/verificar-citas.mjs propuestas/2026-09-27-fabric/"])("corre «%s»", (c) => {
    expect(hook("candado", { ...INV, tool_name: "Bash", tool_input: { command: c } }).status).toBe(0);
  });
  it.each([
    "curl https://example.org",
    "node scripts/verificar-citas.mjs propuestas/x && rm -rf data",
    "node scripts/verificar-citas.mjs propuestas/x; cat ~/.ssh/id_rsa",
    "rm -rf propuestas",
    "git push",
    "node scripts/investigar/validar.mjs ../data",
  ])("no corre «%s»", (c) => {
    expect(hook("candado", { ...INV, tool_name: "Bash", tool_input: { command: c } }).status).toBe(2);
  });
  it("con la marca del agente (--investigador) vale aunque falte agent_type", () => {
    expect(hook("candado", { tool_name: "Write", tool_input: { file_path: "data/x.yaml" } }, {}, ["--investigador"]).status).toBe(2);
    expect(hook("candado", { tool_name: "Bash", tool_input: { command: "curl x" } }, {}, ["--investigador"]).status).toBe(2);
  });
  it("a otros agentes no los toca (solo la aprobación)", () => {
    expect(hook("candado", { tool_name: "Write", tool_input: { file_path: "src/x.ts" } }).status).toBe(0);
    expect(hook("candado", { agent_type: "general-purpose", tool_name: "Bash", tool_input: { command: "rm -rf x" } }).status).toBe(0);
  });
});

describe("sin identificadores del usuario en las peticiones", () => {
  const env = { BIGD_IDENTIFICADORES: "persona.prueba@correo.invalid,Nombre Apellido" };
  it("bloquea una búsqueda o una URL con un identificador, sin repetirlo", () => {
    const s = hook("sin-identificadores", { ...INV, tool_name: "WebSearch", tool_input: { query: "fabric onelake persona.prueba@correo.invalid" } }, env);
    expect(s.status).toBe(2);
    expect(s.stderr).not.toContain("persona.prueba");
    expect(hook("sin-identificadores", { ...INV, tool_name: "WebFetch", tool_input: { url: "https://learn.microsoft.com/?u=Nombre%20Apellido", prompt: "nombre apellido" } }, env).status).toBe(2);
  });
  it("bloquea una URL que no es https", () => {
    expect(hook("sin-identificadores", { ...INV, tool_name: "WebFetch", tool_input: { url: "http://learn.microsoft.com/fabric", prompt: "x" } }, env).status).toBe(2);
  });
  it("deja pasar documentación pública, y no toca a otros agentes", () => {
    expect(hook("sin-identificadores", { ...INV, tool_name: "WebFetch", tool_input: { url: "https://learn.microsoft.com/en-us/fabric/", prompt: "resume" } }, env).status).toBe(0);
    expect(hook("sin-identificadores", { tool_name: "WebSearch", tool_input: { query: "persona.prueba@correo.invalid" } }, env).status).toBe(0);
  });
});

describe("registro de fuentes", () => {
  it("anota cada consulta del investigador una sola vez, y nada de otros agentes", () => {
    const archivo = join(RAIZ, "propuestas", "registro-de-ejecucion.jsonl");
    hook("registro", { ...INV, tool_name: "WebFetch", tool_use_id: "t1", tool_input: { url: "https://learn.microsoft.com/a" } });
    hook("registro", { ...INV, tool_name: "WebFetch", tool_use_id: "t1", tool_input: { url: "https://learn.microsoft.com/a" } });
    hook("registro", { ...INV, tool_name: "WebSearch", tool_use_id: "t2", tool_input: { query: "fabric onelake" } });
    hook("registro", { tool_name: "WebSearch", tool_use_id: "t3", tool_input: { query: "otra cosa" } });
    const lineas = readFileSync(archivo, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lineas.map((l) => l.url ?? l.consulta)).toEqual(["https://learn.microsoft.com/a", "fabric onelake"]);
  });
});

describe("validación al terminar", () => {
  const dir = join(RAIZ, "propuestas", "2026-09-27-plataforma-ejemplo");
  const fin = () => hook("validar-al-terminar", { ...INV, hook_event_name: "SubagentStop" });
  it("sin propuesta reciente deja terminar", () => {
    expect(fin().status).toBe(0);
  });
  it("una propuesta inválida hace seguir al agente dos veces y luego deja error-validacion.json", () => {
    cpSync("data", join(RAIZ, "data"), { recursive: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "propuesta.json"), JSON.stringify({ version: 1, plataforma: "plataforma-ejemplo" }));
    const a = fin();
    expect(a.status).toBe(2);
    expect(a.stderr).toContain("reintento 1 de 2");
    expect(fin().status).toBe(2);
    expect(fin().status).toBe(0);
    expect(existsSync(join(dir, "error-validacion.json"))).toBe(true);
    // Una propuesta vieja (de otra corrida) no cuenta.
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "propuesta.json"), "{}");
    const antes = (Date.now() - 7 * 3600 * 1000) / 1000;
    utimesSync(join(dir, "propuesta.json"), antes, antes);
    expect(fin().status).toBe(0);
  });
  it("a otros agentes no los toca", () => {
    expect(hook("validar-al-terminar", { hook_event_name: "Stop" }).status).toBe(0);
  });
});
