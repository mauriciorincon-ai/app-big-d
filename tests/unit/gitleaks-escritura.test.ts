// @vitest-environment node
// B-25 de la auditoría del S1: el hook de Claude Code revisa con gitleaks el TEXTO que se va a escribir (antes
// corría `protect --staged`, que mira el índice de git y dejaba pasar un secreto recién escrito). La carnada
// canónica del kit se arma por partes SOLO aquí (CLAUDE.md, regla de desarrollo 7). Sin gitleaks instalado
// (el CI) la prueba no corre: el hook solo vive en las sesiones locales; se declara `manual` en la bitácora.
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const hay = spawnSync("gitleaks", ["version"]).status === 0;
const CARNADA = "AWS_ACCESS_KEY_ID=" + "AKIAQ7RTZ4PX" + "KM2WNB3S";
const hook = (tool_name: string, tool_input: Record<string, unknown>) =>
  spawnSync("node", ["scripts/hooks/gitleaks-escritura.mjs"], { input: JSON.stringify({ tool_name, tool_input }), encoding: "utf8" });

describe.skipIf(!hay)("gitleaks sobre lo que se va a escribir", () => {
  it("bloquea la carnada en Write, Edit y MultiEdit", () => {
    expect(hook("Write", { file_path: "a.env", content: CARNADA }).status).toBe(2);
    expect(hook("Edit", { file_path: "a.env", old_string: "x", new_string: CARNADA }).status).toBe(2);
    expect(hook("MultiEdit", { file_path: "a.env", edits: [{ old_string: "x", new_string: "y" }, { old_string: "z", new_string: CARNADA }] }).status).toBe(2);
  });
  it("deja pasar un texto limpio, y la carnada partida (así viaja en el repo)", () => {
    expect(hook("Write", { file_path: "a.ts", content: "const x = 1;" }).status).toBe(0);
    expect(hook("Write", { file_path: "a.ts", content: '"AKIAQ7RTZ4PX" + "KM2WNB3S"' }).status).toBe(0);
  });
});
