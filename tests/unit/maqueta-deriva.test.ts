import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { RAIZ_MAQUETA } from "./lib/maqueta";

// Gate de deriva de la maqueta (regla 8): las páginas de docs/diseno/ son SALIDA del generador
// versionado (scripts/maqueta/). Si alguien edita un SVG a mano o cambia el generador sin regenerar,
// este test lo nombra. Corre el generador hacia un temporal y compara byte a byte.
const salida = mkdtempSync(join(tmpdir(), "maqueta-deriva-"));
execFileSync(process.execPath, ["scripts/maqueta/generar.mjs"], {
  env: { ...process.env, MAQUETA_SALIDA: salida, MAQUETA_SILENCIO: "1" },
});
afterAll(() => rmSync(salida, { recursive: true, force: true }));

const html = (dir: string) => readdirSync(dir).filter((f) => f.endsWith(".html")).sort();

describe("maqueta: docs/diseno/ = salida del generador", () => {
  it("el generador produce exactamente las páginas versionadas", () => {
    expect(html(salida)).toEqual(html(RAIZ_MAQUETA));
  });

  it.each(html(RAIZ_MAQUETA))("%s no se editó a mano", (pagina) => {
    const versionada = readFileSync(join(RAIZ_MAQUETA, pagina), "utf8");
    const generada = readFileSync(join(salida, pagina), "utf8");
    expect(versionada === generada, `${pagina}: difiere de lo que genera scripts/maqueta (pnpm maqueta)`).toBe(true);
  });
});
