// @vitest-environment node
// D-S7-04: cada hoja CSS bloqueante extra suma ~150 ms al LCP simulado de Lighthouse, y el presupuesto no se toca. Cada pantalla
// importa UNA hoja de entrada (`ruta-*.css` o la suya propia) que reúne las demás con @import, en el orden en que se importaban.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const paginas = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    return statSync(ruta).isDirectory() ? paginas(ruta) : f === "page.tsx" ? [ruta] : [];
  });
const importesDeEstilos = (texto: string) => [...texto.matchAll(/^import "@\/styles\/([a-z0-9-]+\.css)";$/gm)].map((m) => m[1]!);

describe("una hoja de entrada por ruta", () => {
  for (const pagina of paginas("src/app")) {
    it(`${pagina.replace("src/app/", "")} importa a lo más una hoja`, () => {
      expect(importesDeEstilos(readFileSync(pagina, "utf8"))).toSatisfy((hojas: string[]) => hojas.length <= 1);
    });
  }

  for (const hoja of readdirSync("src/styles").filter((f) => f.startsWith("ruta-") || f === "informe.css")) {
    it(`${hoja} reúne con @import hojas que existen, sin repetir ninguna`, () => {
      const texto = readFileSync(join("src/styles", hoja), "utf8");
      const importadas = [...texto.matchAll(/^@import "\.\/([a-z0-9-]+\.css)";$/gm)].map((m) => m[1]!);
      expect(importadas.length).toBeGreaterThan(1);
      expect(new Set(importadas).size).toBe(importadas.length);
      for (const h of importadas) expect(() => statSync(join("src/styles", h)), h).not.toThrow();
    });
  }
});
