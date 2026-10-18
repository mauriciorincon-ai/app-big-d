import { spawnSync } from "node:child_process";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// El ensayo de la aprobación (scripts/datos/copia-aprobada.mjs, S7) jamás escribe dentro del repo. Auditoría S7 (Medio 2):
// un enlace simbólico fuera del repo que apunta a él no debe colar el destino. La negativa va antes de copiar nada.
const REPO = resolve(".");

describe("scripts/datos/copia-aprobada.mjs: el destino no puede caer dentro del repo", () => {
  it("un enlace simbólico hacia el repo se niega con código distinto de cero y sin copiar", () => {
    const base = mkdtempSync(join(tmpdir(), "bigd-enlace-"));
    const enlace = join(base, "dentro");
    symlinkSync(REPO, enlace);
    const r = spawnSync("node", ["scripts/datos/copia-aprobada.mjs", "--destino", join(enlace, "x")], {
      cwd: REPO,
      encoding: "utf8",
    });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("dentro del repo");
  });
});
