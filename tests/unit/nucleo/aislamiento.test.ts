// @vitest-environment node
// El núcleo se basta solo (regla dura 1, D-S3-08): corre igual en Node y en el navegador, así que no importa nada que
// no sea suyo. Ni Zod (en el navegador prueba `new Function` y dispara la CSP), ni `node:` (no existe en un Worker), ni
// la app (`@/lib`), ni el diagramador (su vigencia se copió, no se importa).
// Única excepción (S5): `instrumentos-de-plan`, el reusable de la casa que `plan.ts` llama (ondas de Kahn, prioridad de
// acción). Se admite porque es puro como el núcleo —sin Zod, sin `node:`, sin la app, sin reloj ni azar (G2, lint y gate del
// lock)— y esta prueba lo comprueba: sus fuentes solo importan archivos suyos.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const DIR = join(process.cwd(), "src/engine");
const REUSABLE = join(process.cwd(), "packages/instrumentos-de-plan/src");
const IMPORTS = /^\s*(?:import|export)\b[^;]*?\bfrom\s+["']([^"']+)["']/gm;
const importsDe = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(IMPORTS)].map((m) => [f, m[1]!] as const));

it("cada import de src/engine es relativo y se queda dentro de src/engine (salvo el reusable de instrumentos de plan)", () => {
  const ajenos = importsDe(DIR).filter(([, de]) => !/^\.\/[a-z0-9-]+$/.test(de) && de !== "instrumentos-de-plan");
  expect(ajenos).toEqual([]);
});

it("el reusable que el núcleo admite no importa nada fuera de sí: ni la app, ni Zod, ni `node:`", () => {
  const ajenos = importsDe(REUSABLE).filter(([, de]) => !/^\.\/[a-z0-9-]+$/.test(de) && !/^\.\.\/datos\/[a-z0-9-]+\.json$/.test(de));
  expect(ajenos).toEqual([]);
});

it("solo `plan.ts` importa el reusable", () => {
  const usan = importsDe(DIR).filter(([, de]) => de === "instrumentos-de-plan").map(([f]) => f);
  expect(usan).toEqual(["plan.ts"]);
});
