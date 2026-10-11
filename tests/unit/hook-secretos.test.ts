// Plantilla del kit (v1.37.0), adaptada a Big-D: corre el comando REAL del hook PreToolUse de .claude/settings.json.
// @vitest-environment node
/**
 * El hook PreToolUse de Claude Code (`.claude/settings.json`) que busca secretos en lo que se va a escribir: se corre
 * su comando real. Falla CERRADO si falta gitleaks, como el pre-commit (kit v1.37.0; origen planlang AU-S2-B12);
 * `KIT_SIN_GITLEAKS=1` lo salta a sabiendas; deja pasar un contenido limpio y bloquea la carnada canónica (armada
 * partida para que este archivo no la contenga).
 * Adaptación (S3, D-S3-02): el hook de Big-D es `scripts/hooks/gitleaks-escritura.mjs` (Node, sin jq; revisa también
 * MultiEdit y NotebookEdit), con el matcher `Write|Edit|MultiEdit|NotebookEdit`; escribe sus avisos en stderr, que es
 * lo que Claude Code le muestra al agente cuando bloquea con 2. Por eso el PATH vacío lleva `node`.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ajustes = JSON.parse(readFileSync(".claude/settings.json", "utf8")) as {
  hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] };
};
const entrada = ajustes.hooks.PreToolUse.find(
  (h) =>
    h.matcher.split("|").includes("Write") &&
    h.hooks.some((x) => x.command.includes("gitleaks")),
);
const comando =
  entrada?.hooks.find((x) => x.command.includes("gitleaks"))?.command ?? "";

function correr(contenido: string, env: Record<string, string | undefined>) {
  return spawnSync("/bin/bash", ["-c", comando], {
    input: JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: "a.ts", content: contenido },
    }),
    encoding: "utf8",
    env: { ...env, CLAUDE_PROJECT_DIR: process.cwd() } as unknown as NodeJS.ProcessEnv,
  });
}

/** Un PATH con lo básico del sistema y node, sin gitleaks. */
function pathSinGitleaks(): string {
  const dir = mkdtempSync(join(tmpdir(), "hook-sin-"));
  for (const b of ["cat", "printf", "echo", "node"]) {
    const r = spawnSync("/bin/bash", ["-c", `command -v ${b}`], {
      encoding: "utf8",
    });
    if (r.stdout.trim().startsWith("/"))
      symlinkSync(r.stdout.trim(), join(dir, b));
  }
  return dir;
}

const hayGitleaks =
  spawnSync("/bin/bash", ["-c", "command -v gitleaks"]).status === 0;

describe("hook PreToolUse de secretos (kit v1.37.0; origen planlang AU-S2-B12)", () => {
  it("el hook de gitleaks cubre las cuatro herramientas que escriben", () => {
    expect(entrada?.matcher.split("|").sort()).toEqual([
      "Edit",
      "MultiEdit",
      "NotebookEdit",
      "Write",
    ]);
  });

  it("sin gitleaks bloquea, y lo dice", () => {
    const r = correr("hola", { PATH: pathSinGitleaks() });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("falta gitleaks");
  });

  it("KIT_SIN_GITLEAKS=1 lo salta a sabiendas", () => {
    const r = correr("hola", {
      PATH: pathSinGitleaks(),
      KIT_SIN_GITLEAKS: "1",
    });
    expect(r.status).toBe(0);
  });

  it.runIf(hayGitleaks)(
    "con gitleaks: deja pasar lo limpio y bloquea la carnada",
    () => {
      expect(correr("const x = 1;", process.env).status).toBe(0);
      const carnada = ["AWS_ACCESS_KEY_ID=", "AKIAQ7RTZ4PX", "KM2WNB3S"].join(
        "",
      );
      const r = correr(carnada, process.env);
      expect(r.status).toBe(2);
      expect(r.stderr).toContain("SECRET DETECTADO");
    },
  );
});
