// @vitest-environment node
// El pre-commit de git falla CERRADO (kit v1.32.1, K7 del S2): sin gitleaks bloquea el commit, salvo
// `KIT_SIN_GITLEAKS=1` dicho a sabiendas; con gitleaks bloquea la carnada canónica del kit, que se arma por
// partes SOLO en las pruebas (CLAUDE.md, regla de desarrollo 7). Corre en un repo temporal, nunca en este.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const HOOK = resolve("githooks/pre-commit");
const SIN_GITLEAKS = "/usr/bin:/bin"; // git y sh del sistema; gitleaks vive en otra parte
const hay = spawnSync("gitleaks", ["version"]).status === 0;
const CARNADA = "AWS_ACCESS_KEY_ID=" + "AKIAQ7RTZ4PX" + "KM2WNB3S";
let dir = "";

function repo(archivo: string, contenido: string) {
  dir = mkdtempSync(join(tmpdir(), "bigd-precommit-"));
  const git = (...a: string[]) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
  git("init", "-q");
  writeFileSync(join(dir, archivo), contenido);
  git("add", archivo);
}
const correr = (env: NodeJS.ProcessEnv) => spawnSync("sh", [HOOK], { cwd: dir, encoding: "utf8", env });

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("githooks/pre-commit", () => {
  it("sin gitleaks bloquea el commit y dice cómo seguir", () => {
    repo("a.ts", "const x = 1;\n");
    const r = correr({ PATH: SIN_GITLEAKS, HOME: dir });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("KIT_SIN_GITLEAKS=1");
  });
  it("sin gitleaks deja pasar solo con KIT_SIN_GITLEAKS=1", () => {
    repo("a.ts", "const x = 1;\n");
    expect(correr({ PATH: SIN_GITLEAKS, HOME: dir, KIT_SIN_GITLEAKS: "1" }).status).toBe(0);
  });
  it.skipIf(!hay)("con gitleaks bloquea la carnada y deja pasar un archivo limpio", () => {
    repo("a.env", `${CARNADA}\n`);
    expect(correr(process.env).status).toBe(1);
    rmSync(dir, { recursive: true, force: true });
    repo("a.ts", "const x = 1;\n");
    expect(correr(process.env).status).toBe(0);
  });
});
