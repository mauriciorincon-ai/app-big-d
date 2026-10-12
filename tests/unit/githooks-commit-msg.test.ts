// @vitest-environment node
// El commit-msg de git exige commits convencionales (regla 6 del kit; S7: la regla no tenía quien la hiciera cumplir). Corre sobre
// archivos temporales con el mensaje: no toca ningún repo.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const HOOK = resolve("githooks/commit-msg");
let dir = "";
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));
function correr(mensaje: string) {
  dir = mkdtempSync(join(tmpdir(), "bigd-commitmsg-"));
  const archivo = join(dir, "COMMIT_EDITMSG");
  writeFileSync(archivo, `${mensaje}\n\ncuerpo\n`);
  return spawnSync("sh", [HOOK, archivo], { encoding: "utf8" });
}

describe("githooks/commit-msg", () => {
  it.each([
    "feat(sprint-007): [F1] algo",
    "fix: corrige",
    "docs(sprint-007): [F3] cierre",
    "test(plan)!: rompe a propósito",
    "chore(deps): agrupa",
    'Merge pull request #19 from x/y',
    'Revert "feat: algo"',
    "fixup! feat: algo",
  ])("deja pasar «%s»", (m) => {
    const r = correr(m);
    expect(r.status, r.stdout).toBe(0);
  });

  it.each(["arreglo cosas", "Update README.md", "feat sin dos puntos", "FEAT: mayúsculas", "feat: ", "wip", "feat(Ámbito): raro"])(
    "bloquea «%s» y dice cómo arreglarlo",
    (m) => {
      const r = correr(m);
      expect(r.status).toBe(1);
      expect(r.stdout).toContain("commit convencional");
      expect(r.stdout).toContain(m);
    },
  );

  it("el hook está en githooks/, que es lo que `core.hooksPath` activa, y es ejecutable", () => {
    const r = spawnSync("sh", ["-c", `test -x ${HOOK} && echo si`], { encoding: "utf8" });
    expect(r.stdout.trim()).toBe("si");
  });
});
