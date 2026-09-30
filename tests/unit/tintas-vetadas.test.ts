import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TINTAS_VETADAS } from "../../scripts/paleta/generar-tokens.mjs";
import { archivosDeCodigo, leer } from "./lib/codigo";
import { usosVetados } from "./lib/tintas";

/**
 * Regla 5-b del CLAUDE.md sobre el PRODUCTO (A-24, S1 fase 4): las tintas vetadas como texto
 * (`TINTAS_VETADAS`: no alcanzan 4,5:1, lo mide paleta-diagramador) fallan aquí, en `pnpm test`, y no en
 * axe al final. Se barren las hojas de `src/`, el código de `src/` y del diagramador (clases de Tailwind y
 * estilos en línea) y lo que el motor DIBUJA: los golden files, que son su salida real byte a byte.
 * Demo en rojo en sprints/SPRINT_001-implementation-log.md: `text-linea` en un componente y `fill` con
 * la tinta en una clase de texto del diagrama.
 */
const GOLDEN = "packages/diagramador/test/golden";

describe("tintas vetadas como texto, en el producto", () => {
  const css = archivosDeCodigo("src", [".css"]);
  const codigo = [...archivosDeCodigo("src", [".ts", ".tsx"]), ...archivosDeCodigo("packages/diagramador/src", [".ts"])];
  const svgs = readdirSync(GOLDEN).filter((f) => f.endsWith(".svg"));

  it("hay qué barrer: hojas, código y dibujos", () => {
    expect(css.length).toBeGreaterThan(0);
    expect(codigo.length).toBeGreaterThan(0);
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("ninguna hoja, componente ni dibujo pinta texto con una tinta vetada", () => {
    const con = [
      ...css.flatMap((f) => usosVetados(leer(f), "css", TINTAS_VETADAS).map((u) => `${f}  ${u}`)),
      ...codigo.flatMap((f) => usosVetados(leer(f), "codigo", TINTAS_VETADAS).map((u) => `${f}  ${u}`)),
      ...svgs.flatMap((f) => usosVetados(leer(`${GOLDEN}/${f}`), "html", TINTAS_VETADAS).map((u) => `${f}  ${u}`)),
    ];
    expect(con).toEqual([]);
  });
});
