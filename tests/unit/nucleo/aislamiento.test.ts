// @vitest-environment node
// El núcleo se basta solo (regla dura 1, D-S3-08): corre igual en Node y en el navegador, así que no importa nada que
// no sea suyo. Ni Zod (en el navegador prueba `new Function` y dispara la CSP), ni `node:` (no existe en un Worker), ni
// la app (`@/lib`), ni el diagramador (su vigencia se copió, no se importa).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const DIR = join(process.cwd(), "src/engine");

it("cada import de src/engine es relativo y se queda dentro de src/engine", () => {
  const ajenos = readdirSync(DIR)
    .filter((f) => f.endsWith(".ts"))
    .flatMap((f) => [...readFileSync(join(DIR, f), "utf8").matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm)].map((m) => [f, m[1]!] as const))
    .filter(([, de]) => !/^\.\/[a-z0-9-]+$/.test(de));
  expect(ajenos).toEqual([]);
});
